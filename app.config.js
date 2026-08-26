module.exports = ({ config }) => {
  const projectId = process.env.EAS_PROJECT_ID?.trim();
  const owner = process.env.EXPO_OWNER?.trim();

  return {
    ...config,
    ...(owner ? { owner } : {}),
    ...(projectId
      ? {
          extra: {
            ...config.extra,
            eas: {
              ...config.extra?.eas,
              projectId
            }
          }
        }
      : {})
  };
};
