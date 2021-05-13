/* 
Saga Options:  
*/

/**
 * @class Represents a Saga transaction
 * @author hulind KTH, arthursi KTH
 * @argument options
}
 */
class Saga {

    /**
     * @constructor instanciate a Saga transactions given optional
     * @argument { preventFailedBegining: boolean, simulateFailure: object, debugging: boolean, reportFailedRepair: boolean } options
     */
    constructor(options = {preventFailedBegining: true, simulateFailure: {}, debugging: false, reportFailedRepair: true}) {
        /** @private */ this._failed = false;
        /** @private */ this._succeeded = false;
        /** @private */ this._entries = [];
        /** @private */ this._opts = options;
        /** @private */ this._promiseResolve;
        /** @private */ this._promiseReject;
        /** @private */ this._promise = new Promise((resolve, reject) => {
            this._promiseResolve = resolve;
            this._promiseReject = reject;
        })

        /** @private */ this._onFinallyFailedListeners = [];
        /** @private */ this._onFinallySucceededListeners = [];
        /** @private */ this._onStepFailedListeners = [];
        /** @private */ this._onStepSucceededListeners = [];
    }

    /** 
     * @public Begin a new step
     * @argument {object} options
     * @description
     * The following are posible options:
     * - name: provide a custom name for this step (string).
    */ 
    begin({name} = {}) {
        if(this._opts.preventFailedBegining && this.hasFailed())
            throw "SAGA Can't begin(): The saga has already failed.";
        let se = new SagaStep(name || ("step#" + this._entries.length), this);
        this._entries.push(se);
        if(this._opts.debugging)
            console.log("SAGA DEBUG", "saga begin step:", step.getName());
        return se;
    }

    _fail(step) {
        this._failed = true;
        if(step) {
            this._onStepFailed({failedStep: {error: step.getError(), name: step.getName()}});
            if(this._opts.debugging)
                console.log("SAGA DEBUG", "step failed:", step.getName(), step.getError());
        }
        let failedSteps = [];
        for(let entry of this._entries) {
            if(!entry.hasFailed() && !entry.hasSucceeded())
                return;
            if(entry.hasFailed())
                failedSteps.push({error: entry.getError(), name: entry.getName()});
        }
        for(let entry of this._entries)
            if(entry.hasSucceeded()) {
                try {
                    entry._onRepair();
                }
                catch(err) {
                    entry._onFailedRepair(err);
                    if(this._opts.reportFailedRepair)
                        console.error("SAGA", "Error when repairing step:", entry.getName(), ":", err);
                }
            }
        this._onFinallyFailed({failedSteps: failedSteps});
        this._promiseReject({failedSteps: failedSteps});
        if(this._opts.debugging)
            console.log("SAGA DEBUG", "finally failed steps:", failedSteps);
    }

    _success(step) {
        if(step) {
            this._onStepSucceeded({name: step.getName()});
            if(this._opts.debugging)
                console.log("SAGA DEBUG", "step succeeded:", step.getName());
        }
        if(this._opts.simulateFailure[step.getName()]) {
            step.fail(this._opts.simulateFailure[step.getName()]);
            if(this._opts.debugging)
                console.log("SAGA DEBUG", "simulated failure on step:", step.getName());
            return;
        }
        if(this.hasFailed())
            return this._fail(null);

        for(let entry of this._entries)
            if(!entry.hasSucceeded())
                return;
        this._succeeded = true;
        this._onFinallySucceeded({});
        this._promiseResolve({});
        if(this._opts.debugging)
            console.log("SAGA DEBUG", "finally succeeded");
    }

    /** 
     * @public Has step failed
     * @returns {boolean}
    */ 
    hasFailed() {
        return this._failed;
    }

    /** 
     * @private Event callback for when all steps either fail or was successful but atleat one failed.
     * @argument {*} event
    */ 
    _onFinallyFailed(evt) {
        for(let e of this._onFinallyFailedListeners)
            e(evt);
    }

    /** 
     * @private Event callback for when all steps are successful.
     * @argument {*} event
    */ 
    _onFinallySucceeded(evt) {
        for(let e of this._onFinallySucceededListeners)
            e(evt);
    }

    /** 
     * @private Event callback for when a step fails.
     * @argument  {*} event
    */ 
    _onStepFailed(evt) {
        for(let e of this._onStepFailedListeners)
            e(evt);
    }

    /** 
     * @private Event callback for when a step Succeed.
     * @argument  {*} evt
    */ 
    _onStepSucceeded(evt) {
        for(let e of this._onStepSucceededListeners)
            e(evt);
    }


    /** 
     * @public Add event callback for when all steps either fail or was successful but atleat one failed.
     * @argument {*} callback
    */ 
    onFinallyFailed(callback) {
        this._onFinallyFailedListeners.push(callback);
    }

    /** 
     * @public Add event callback for when all steps are successful.
     * @argument {*} callback
    */ 
    onFinallySucceeded(callback) {
        this._onFinallySucceededListeners.push(callback);
    }

    /** 
     * @public Add event callback for when a step fails.
     * @argument  {*} callback
    */ 
    onStepFailed(callback) {
        this._onStepFailedListeners.push(callback);
    }

    /** 
     * @public Add event callback for when a step Succeed.
     * @argument  {*} callback
    */ 
    onStepSucceeded(callback) {
        this._onStepSucceededListeners.push(callback);
    }


    /** 
     * @public Get the promise version of onFinallyFailed and onFinallySucceeded.
     * @returns {Promise}
    */ 
    promise() {
        return this._promise;
    }

    /** 
     * @public Get the options set when the Saga is constructed.
     * @returns {object}
    */ 
    getOptions() {
        return this._opts;
    }
}

class SagaStep {
    constructor(name, saga) {
        /** @private */ this._name = name;
        /** @private */ this._saga = saga;
        /** @private */ this._failed = false;
        /** @private */ this._succeeded = false;
        /** @private */ this._error = null;

        this._onRepairListeners = []
        this._onFailedRepairListeners = []
    }

    /** 
     * @public Trigger a success in this step.
    */ 
    success() {
        this._succeeded = true;
        this._saga._success(this);
        if(this._saga.getOptions().debugging)
            console.log("SAGA DEBUG", "step called success:", this.getName());
    }

    /** 
     * @public Trigger a failure in this step.
     * @argument  {*} error
    */ 
    fail(e = null) {
        this._failed = true;
        this._succeeded = false;
        this._error = e;
        this._saga._fail(this);
        if(this._saga.getOptions().debugging)
            console.log("SAGA DEBUG", "step called fail:", this.getName(), "with error: ", e);
    }

    /** 
     * @public Has step failed
     * @returns {boolean}
    */ 
    hasFailed() {
        return this._failed;
    }

    /** 
     * @public Has step failed
     * @returns {boolean}
    */ 
    hasSucceeded() {
        return this._succeeded;
    }

    /** @protected Event callback */ 
    _onRepair() {
        for(let e of this._onRepairListeners)
            e();
    }

    /** 
     * @protected Event callback
     * @argument {*} error
    */ 
    _onFailedRepair(err) {
        for(let e of this._onFailedRepairListeners)
            e(err);
    }

    /** @public Add event callback */ 
    onRepair(callback) {
        this._onRepairListeners.push(callback);
    }

    /** 
     * @protected Add event callback
     * @argument {*} error
    */ 
    onFailedRepair(callback) {
        this._onFailedRepairListeners.push(callback);
    }

    /** 
     * @public Get the error provided by fail(error)
     * @returns {*} error
    */ 
    getError() {
        return this._error;
    }

    /** 
     * @public Get the name of the step
     * @returns {string} name
    */  
    getName() {
        return this._name;
    }
}

module.exports = {Saga: Saga};