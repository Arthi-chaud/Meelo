{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = with pkgs; [
    go
    golangci-lint
    gopls
    chromaprint
    opencv4
    pkg-config
  ];
  shellHook = ''
    export PKG_CONFIG_PATH="$PKG_CONFIG_PATH:${pkgs.opencv4}/lib/pkgconfig";  
  '';

}
