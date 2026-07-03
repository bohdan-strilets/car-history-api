export const EAGER_TRANSFORMATIONS = [
  {
    transformation: 'thumbnail',
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'auto',
  },
  {
    transformation: 'small',
    width: 400,
    crop: 'limit',
  },
  {
    transformation: 'medium',
    width: 800,
    crop: 'limit',
  },
  {
    transformation: 'large',
    width: 1600,
    crop: 'limit',
  },
] as const;
