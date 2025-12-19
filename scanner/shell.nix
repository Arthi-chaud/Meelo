{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = with pkgs; [
    go
    golangci-lint
    chromaprint
    opencv
  ];
  shellHook = ''
    if ! test -d app/wtr;
      then sh dl_watcher.sh
      fi
  '';
}
