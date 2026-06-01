const toJson = (entry) => JSON.stringify({ ts: new Date().toISOString(), ...entry });

export const logInfo = (event, data = {}) => {
  console.log(toJson({ level: 'info', event, ...data }));
};

export const logWarn = (event, data = {}) => {
  console.warn(toJson({ level: 'warn', event, ...data }));
};

export const logError = (event, data = {}) => {
  console.error(toJson({ level: 'error', event, ...data }));
};
