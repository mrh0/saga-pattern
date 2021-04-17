/**
 * If the provided promise fails the returned value will be the provided default.
 * @param {Promise} promise 
 * @param {*} defaultResponse 
 * @returns {Promise<any>} passtrough promise
 */
function defRes(promise, defaultResponse) {
    try {
        return await promise;
    }
    catch(err) {
        return defaultResponse;
    }
}

