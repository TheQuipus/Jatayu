export type SereneSceneHandle = {
  setScrollProgress: (progress: number) => void;
  dispose: () => void;
};

export type SereneSceneOptions = {
  usePlaceholders?: boolean;
};
