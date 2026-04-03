{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  packages = with pkgs; [
    nodejs_24
    bun
    yarn-berry # TODO DELETE ME
    biome
    prisma-language-server
  ];
}
