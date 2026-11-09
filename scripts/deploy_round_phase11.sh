#!/usr/bin/env bash
# 部署轮次：算术闪卡整局计时 + 全量牌堆（Phase 11）
# 本轮 live 版本 = main@d14f44c 之前的构建，app.js md5=638d9b56b4e5629ede75556f4bdeaa69
# 两个对外路径都要更新（nginx: location ^~ /games/ { alias /var/www/games/current/; }）
#   /games/          -> /var/www/games/current/
#   /games/current/  -> /var/www/games/current/current/   （嵌套副本，同样要更新）
set -u

HOST=sophie520
REMOTE_ROOT=/var/www/games
REMOTE=$REMOTE_ROOT/current
STAMP=$(date +%Y%m%d-%H%M%S)
LIVE_APP_MD5=638d9b56b4e5629ede75556f4bdeaa69
LABEL=mathflash-timed
BAK=$REMOTE_ROOT/current.bak.$LABEL-$LIVE_APP_MD5-$STAMP
BAK_NESTED=$REMOTE_ROOT/current.bak.$LABEL-nested-$LIVE_APP_MD5-$STAMP
STAGE=$REMOTE_ROOT/.stage-$LABEL-$STAMP
STAGE_NESTED=$REMOTE_ROOT/.stage-nested-$LABEL-$STAMP
TAR_LOCAL=/tmp/beta_words_phase11_$STAMP.tar.gz
LOG=/tmp/deploy_phase11_$STAMP.log

echo "=== 部署轮次 $LABEL @ $STAMP ==="
echo "HOST=$HOST  REMOTE=$REMOTE"
echo "BAK=$BAK"
echo "BAK_NESTED=$BAK_NESTED"
echo "STAGE=$STAGE"

# ---------- 0. 打包本地构建（main 的 current/ 全量） ----------
cd /home/alpha/codex/beta_words || exit 1
git archive main current | gzip -c > "$TAR_LOCAL" || exit 1
echo "本地 tar: $TAR_LOCAL  $(stat -c%s "$TAR_LOCAL") bytes"

# ---------- 1. 读线上事实 ----------
LIVE_MD5=$(ssh -T "$HOST" "md5sum $REMOTE/app.js" | cut -d' ' -f1)
echo "线上 app.js md5 = $LIVE_MD5"
if [ "$LIVE_MD5" != "$LIVE_APP_MD5" ]; then
  echo "!! 线上版本与预期不符（预期 $LIVE_APP_MD5）——可能已有别的部署落地，中止"
  exit 2
fi
LIVE_NEST_MD5=$(ssh -T "$HOST" "md5sum $REMOTE/current/app.js 2>/dev/null" | cut -d' ' -f1)
echo "线上嵌套 app.js md5 = $LIVE_NEST_MD5"

# ---------- 2. 备份（先证明可回滚） ----------
ssh -T "$HOST" "cp -a '$REMOTE' '$BAK'" || { echo "!! 外层备份失败"; exit 3; }
BAK_MD5=$(ssh -T "$HOST" "md5sum '$BAK/app.js'" | cut -d' ' -f1)
echo "备份 md5 = $BAK_MD5"
[ "$BAK_MD5" = "$LIVE_MD5" ] || { echo "!! 备份 md5 不等于线上 md5，回滚点无效，中止"; exit 4; }
echo "备份可用 ✅ ($BAK)"

ssh -T "$HOST" "cp -a '$REMOTE/current' '$BAK_NESTED'" || { echo "!! 嵌套备份失败"; exit 3; }
BAK_NEST_MD5=$(ssh -T "$HOST" "md5sum '$BAK_NESTED/app.js'" | cut -d' ' -f1)
[ "$BAK_NEST_MD5" = "$LIVE_NEST_MD5" ] || { echo "!! 嵌套备份 md5 不符，中止"; exit 4; }
echo "嵌套备份可用 ✅ ($BAK_NESTED)"

# ---------- 3. 上传到 staging（不碰线上） ----------
ssh -T "$HOST" "mkdir -p '$STAGE' '$STAGE_NESTED'" || exit 5
TAR_REMOTE=$REMOTE_ROOT/.upload-$LABEL-$STAMP.tar.gz
scp -q "$TAR_LOCAL" "$HOST:$TAR_REMOTE" || { echo "!! 上传失败"; exit 5; }
echo "已上传 $TAR_REMOTE ($(ssh -T "$HOST" "stat -c%s '$TAR_REMOTE'") bytes)"
ssh -T "$HOST" "tar -x -z -C '$STAGE' --strip-components=1 -f '$TAR_REMOTE'" || exit 5
ssh -T "$HOST" "tar -x -z -C '$STAGE_NESTED' --strip-components=1 -f '$TAR_REMOTE'" || exit 5
ssh -T "$HOST" "rm -f '$TAR_REMOTE'"
# 生产目录属主是 mysql:mysql（文件 664 / 目录 775），git archive 解出来是 root:root 644，
# nginx 以 www 身份读；统一改回生产属主权限，避免下次运维改文件时权限不一致
ssh -T "$HOST" "chown -R mysql:mysql '$STAGE' '$STAGE_NESTED' && find '$STAGE' '$STAGE_NESTED' -type d -exec chmod 775 {} + && find '$STAGE' '$STAGE_NESTED' -type f -exec chmod 664 {} +"
echo "staging 解包完成（属主已对齐 mysql:mysql）"

# ---------- 4. staging 侧全量比对（替换之前） ----------
# 本地清单：从本地解包出来的树算（与上传的 tar 同源）
LOCAL_TREE=/tmp/repo_tree_phase11
rm -rf "$LOCAL_TREE"; mkdir -p "$LOCAL_TREE"
tar -x -z -C "$LOCAL_TREE" --strip-components=1 -f "$TAR_LOCAL" || exit 5
( cd "$LOCAL_TREE" && find . -type f -printf '%P\n' | sort | xargs md5sum ) > /tmp/repo_md5_phase11.txt
REPO_MD5_LOCAL=/tmp/repo_md5_phase11.txt
STAGE_CNT=$(wc -l < "$REPO_MD5_LOCAL")
# 远端清单：staging 目录在远端，必须走 ssh
ssh -T "$HOST" "cd '$STAGE' && find . -type f -printf '%P\n' | sort | xargs md5sum" > /tmp/stage_md5_phase11.txt 2>&1
STAGE_REMOTE_CNT=$(wc -l < /tmp/stage_md5_phase11.txt)
LC_ALL=C sort -k2 "$REPO_MD5_LOCAL" > /tmp/a.s
LC_ALL=C sort -k2 /tmp/stage_md5_phase11.txt > /tmp/b.s
HIT=$(comm -12 /tmp/a.s /tmp/b.s | wc -l)
echo "staging 比对：本地 $STAGE_CNT / 远端 $STAGE_REMOTE_CNT / 命中 $HIT"
if [ "$STAGE_CNT" -ne 110 ] || [ "$STAGE_REMOTE_CNT" -ne 110 ] || [ "$HIT" -ne 110 ]; then
  echo "!! staging 侧全量比对不通过（必须 110/110/110），中止，不动线上"
  echo "--- 本地有远端没有 ---"; comm -23 /tmp/a.s /tmp/b.s | head -20
  echo "--- 远端有本地没有 ---"; comm -13 /tmp/a.s /tmp/b.s | head -20
  ssh -T "$HOST" "rm -rf '$STAGE' '$STAGE_NESTED'"
  exit 6
fi
echo "staging 全量比对通过 ✅ 110/110"

# ---------- 5. 原子替换 ----------
ssh -T "$HOST" "
  set -e
  mv '$STAGE_NESTED' '$STAGE/current'
  mv '$REMOTE' '$REMOTE.old-$STAMP'
  mv '$STAGE' '$REMOTE'
  echo replaced
" || {
  echo "!! 替换失败，回滚"
  ssh -T "$HOST" "rm -rf '$REMOTE'; mv '$REMOTE.old-$STAMP' '$REMOTE'"
  exit 7
}
echo "替换完成"

# ---------- 6. 替换后重读线上 md5（只告警，不 exit 1） ----------
ssh -T "$HOST" "cd '$REMOTE' && find . -type f -not -path './current/*' -printf '%P\n' | sort | xargs md5sum" > /tmp/prod_after.txt 2>&1
ssh -T "$HOST" "cd '$REMOTE/current' && find . -type f -printf '%P\n' | sort | xargs md5sum" > /tmp/prod_nest_after.txt 2>&1
OUT_CNT=$(wc -l < /tmp/prod_after.txt)
NEST_CNT=$(wc -l < /tmp/prod_nest_after.txt)
LC_ALL=C sort -k2 "$REPO_MD5_LOCAL" > /tmp/a.s
LC_ALL=C sort -k2 /tmp/prod_after.txt > /tmp/c.s
LC_ALL=C sort -k2 /tmp/prod_nest_after.txt > /tmp/d.s
HIT2=$(comm -12 /tmp/a.s /tmp/c.s | wc -l)
HITN=$(comm -12 /tmp/a.s /tmp/d.s | wc -l)
echo "替换后：外层 $OUT_CNT 文件 / 命中 $HIT2 ；嵌套 $NEST_CNT 文件 / 命中 $HITN"
if [ "$HIT2" -ne 110 ] || [ "$HITN" -ne 110 ]; then
  echo "!! 替换后比对不一致，请主会话独立复核（线上已是新版本）"
  echo "--- 线上有本地没有（外层） ---"; comm -13 /tmp/a.s /tmp/c.s | head -20
  echo "--- 线上有本地没有（嵌套） ---"; comm -13 /tmp/a.s /tmp/d.s | head -20
fi

# ---------- 7. 清理 ----------
ssh -T "$HOST" "rm -rf '$REMOTE.old-$STAMP'"
echo "旧目录已清理（备份保留）"

echo ""
echo "===== 回滚命令（可直接复制执行） ====="
echo "ssh -T $HOST \"rm -rf '$REMOTE' && cp -a '$BAK' '$REMOTE'\""
echo "ssh -T $HOST \"rm -rf '$REMOTE/current' && cp -a '$BAK_NESTED' '$REMOTE/current'\""
echo "===== 回滚命令结束 ====="
echo "DEPLOY_DONE"
