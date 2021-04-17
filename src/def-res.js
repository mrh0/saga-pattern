/**
 * 
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

