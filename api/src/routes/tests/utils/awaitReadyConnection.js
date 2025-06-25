export default connection =>
  new Promise((resolve, reject) => {
    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Database connection timeout after 10 seconds'));
    }, 10000);

    if (connection.readyState === 1) {
      clearTimeout(timeout);
      resolve();
    } else {
      const onConnected = () => {
        clearTimeout(timeout);
        connection.removeListener('error', onError);
        resolve();
      };

      const onError = (error) => {
        clearTimeout(timeout);
        connection.removeListener('connected', onConnected);
        reject(error);
      };

      connection.once('connected', onConnected);
      connection.once('error', onError);
    }
  });
