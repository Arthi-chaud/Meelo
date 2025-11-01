#!/bin/sh

REPO=https://github.com/e-dant/watcher
TAG=0.13.8
URL="$REPO/archive/refs/tags/$TAG.zip"
TAR_OUT_DIR=/tmp/watcher-$TAG
DEST=app/

rm -rf "$DEST"/*

curl -L "$URL" | tar xz 
mv watcher-$TAG $TAR_OUT_DIR
cp  $TAR_OUT_DIR/watcher-c/src/*.cpp "$DEST"
mkdir "$DEST"/wtr
cp $TAR_OUT_DIR/watcher-c/include/wtr/* $TAR_OUT_DIR/include/wtr/* "$DEST"/wtr 

rm -rf /tmp/watcher.zip /tmp/watcher
