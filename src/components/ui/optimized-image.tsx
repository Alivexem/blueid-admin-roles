"use client";

import NextImage, { type ImageProps } from "next/image";

import { IMAGE_QUALITY_PHOTO } from "@/lib/image-quality";

export { IMAGE_QUALITY_PHOTO, IMAGE_QUALITY_SHARP } from "@/lib/image-quality";

function needsUnoptimizedSrc(src: ImageProps["src"]): boolean {
  if (typeof src !== "string") return false;
  return (
    src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("cid:")
  );
}

export type OptimizedImageProps = ImageProps;

export function OptimizedImage({
  quality = IMAGE_QUALITY_PHOTO,
  unoptimized,
  ...props
}: OptimizedImageProps) {
  if (typeof props.src === "string") {
    const s = props.src.trim();
    if (
      s &&
      !s.startsWith("http://") &&
      !s.startsWith("https://") &&
      !s.startsWith("/") &&
      !s.startsWith("data:") &&
      !s.startsWith("blob:") &&
      !s.startsWith("cid:")
    ) {
      return (
        <div className={props.className} aria-hidden title="Invalid Image" />
      );
    }
  }
  const forceUnopt = needsUnoptimizedSrc(props.src);
  const useUnopt = Boolean(forceUnopt || unoptimized);
  return (
    <NextImage
      {...props}
      unoptimized={useUnopt}
      {...(useUnopt ? {} : { quality })}
    />
  );
}
