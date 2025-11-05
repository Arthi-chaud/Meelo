#!/bin/sh

REPO=https://github.com/e-dant/watcher
TAG=0.13.8
URL="$REPO/archive/refs/tags/$TAG.tar.gz"
TAR_OUT_DIR=./watcher-$TAG
DEST=app/

rm -rf "$DEST"/wtr "$TAR_OUT_DIR"

curl -L "$URL" | tar xz 
cp  $TAR_OUT_DIR/watcher-c/src/*.cpp "$DEST"
mkdir "$DEST"/wtr
cp $TAR_OUT_DIR/watcher-c/include/wtr/* $TAR_OUT_DIR/include/wtr/* "$DEST"/wtr 

rm -rf "$TAR_OUT_DIR"
