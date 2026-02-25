{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = with pkgs; [
    nodejs_24
    biome
    yarn-berry
    watchman
    cocoapods
    # TODO android toolstack
  ];
  shellHook = ''
    unset CC
    unset CXX
    unset LD
    unset LDFLAGS
    export PATH=/usr/bin:/bin:/usr/sbin:/sbin:`git rev-parse --show-toplevel`/front/node_modules/.bin:$PATH
  '';
}
