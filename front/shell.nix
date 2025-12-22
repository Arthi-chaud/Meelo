{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = with pkgs; [
    nodejs_24
    biome
    yarn-berry
    watchman
    nodePackages.eas-cli
    # TODO android toolstack
  ];
}
