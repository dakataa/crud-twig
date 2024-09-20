const environment = process.env.NODE_ENV || 'development';
export default {
    info: (...args) => {
        if (environment !== 'development') {
            return;
        }

        console.log(...args);
    },

    debug: (...args) => {
        if (environment !== 'development') {
            return;
        }

        console.debug(...args);
    }
}
