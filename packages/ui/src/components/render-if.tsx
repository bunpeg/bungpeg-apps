interface Props {
  condition: boolean;
  children: any;
  fallback?: any;
}

export const RenderIf = (props: Props) => {
  const {
    children,
    condition,
    fallback = null,
  } = props;

  if (condition) {
    return children;
  }

  return fallback;
};
