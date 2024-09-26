const environment = process.env.NODE_ENV || 'dev';
export default {
    info: (...args) => {
        if (environment !== 'dev') {
            return;
        }

        console.log(...args);
    },

    debug: (...args) => {
        if (environment !== 'dev') {
            return;
        }

        console.debug(...args);
    }
}
