import * as redis from 'lib/connections/redis';

// Global cleanup that runs once after all tests complete
after(async function globalCleanup() {
  console.log('Running global test cleanup...');

  try {
    // Close Redis connections (only if they exist)
    const redisClient = redis.getSingletonClient();
    const redisSubClient = redis.getSingletonSubscriptionClient();

    if (redisClient) {
      if (redisClient.status === 'ready') {
        console.log('Closing Redis client');
        await redisClient.quit();
        console.log('Successfully closed Redis client');
      } else {
        console.log('Redis client not ready', redisClient.status);
      }
    } else {
      console.log('Redis client not found');
    }

    if (redisSubClient) {
      if (redisSubClient.status === 'ready') {
        console.log('Closing Redis subscription client');
        await redisSubClient.quit();
        console.log('Successfully closed Redis subscription client');
      } else {
        console.log('Redis subscription client not ready', redisSubClient.status);
      }
    } else {
      console.log('Redis subscription client not found');
    }

    // Force close ALL mongoose connections
    const mongoose = require('mongoose');
    await mongoose.disconnect();
    console.log('Successfully disconnected all mongoose connections');

    // Try to close persona service connection if it exists
    try {
      const getPersonaService = require('lib/connections/personaService').default;
      const personaService = getPersonaService();

      if (personaService && personaService.repo && personaService.repo.db) {
        console.log('Attempting to close persona service connection...');

        // Try to close the mongo client if it has a close method
        if (typeof personaService.repo.db.close === 'function') {
          await personaService.repo.db.close();
          console.log('Successfully closed persona service connection');
        } else if (typeof personaService.repo.db.client === 'object' &&
                   typeof personaService.repo.db.client.close === 'function') {
          await personaService.repo.db.client.close();
          console.log('Successfully closed persona service client connection');
        } else {
          console.log('Persona service connection does not have a close method');
        }
      } else {
        console.log('Persona service not initialized or no db found');
      }
    } catch (err) {
      console.log('Error trying to close persona service:', err.message);
    }

    // Force close any remaining sockets to MongoDB
    if (process.env.TESTING) {
      console.log('=== Forcing closure of remaining MongoDB sockets ===');
      const handles = process._getActiveHandles();
      handles.forEach((handle, index) => {
        if (handle.constructor.name === 'Socket' &&
            handle.remotePort === 27017 &&
            !handle.destroyed) {
          console.log(`Force destroying MongoDB socket ${index} (${handle.remoteAddress}:${handle.remotePort})`);
          try {
            handle.destroy();
          } catch (err) {
            console.log(`Error destroying socket ${index}:`, err.message);
          }
        }
      });

      // Give a moment for socket cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if we successfully closed everything
      const finalHandles = process._getActiveHandles();
      const remainingSockets = finalHandles.filter(h =>
        h.constructor.name === 'Socket' && h.remotePort === 27017
      );

      if (remainingSockets.length === 0) {
        console.log('✅ All MongoDB sockets successfully closed');
        console.log('🎉 All connections cleaned up - process should exit naturally!');
      } else {
        console.log(`⚠️  Still have ${remainingSockets.length} MongoDB socket(s), forcing exit`);
        setTimeout(() => {
          console.log('Force exiting process');
          process.exit(0);
        }, 1000).unref();
      }
    }

    console.log('Global test cleanup completed');

  } catch (err) {
    console.warn('Failed to close connections:', err.message);
  }
});