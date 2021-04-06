/* 
Saga Options: {
    preventFailedBegining (true) : Throw error when calling begin() after the Saga has failed
} 
*/

class Saga {
    constructor(options = {preventFailedBegining: true}) {
        this._failed = false;
        this._succeeded = false;
        this._entries = [];
        this._opts = options;
        this._promiseResolve;
        this._promiseReject;
        this._promise = new Promise((resolve, reject) => {
            this._promiseResolve = resolve;
            this._promiseReject = reject;
        })
    }

    begin({name} = {}) { //Public
        if(this._opts.preventFailedBegining && this.hasFailed())
            throw "Can't begin(): The saga has already failed.";
        let se = new SagaStep(name || ("step#" + this._entries.length), this);
        this._entries.push(se);
        return se;
    }

    _fail(step) { //Private
        this._failed = true;
        if(step)
            this.onStepFailed({failedStep: step});
        let failedSteps = [];
        for(let entry of this._entries) {
            if(!entry.hasFailed() && !entry.hasSucceeded())
                return;
            if(entry.hasFailed())
                failedSteps.push(entry);
        }
        for(let entry of this._entries)
            if(entry.hasSucceeded())
                entry.onRepair();
        this.onFinallyFailed({failedSteps: failedSteps});
        this._promiseReject({failedSteps: failedSteps});
    }

    _success(name) { //Private
        if(this.hasFailed())
            return this._fail(null);

        for(let entry of this._entries)
            if(!entry.hasSucceeded())
                return;
        this._succeeded = true;
        this.onFinallySucceeded({});
        this._promiseResolve({});
    }

    hasFailed() { //Public
        return this._failed;
    }

    onFinallyFailed(evt) {} //Public Event

    onFinallySucceeded(evt) {} //Public Event

    onStepFailed(evt) {} //Public Event

    promise() {
        return this._promise;
    }
}

class SagaStep {
    constructor(name, saga) {
        this._name = name;
        this._saga = saga;
        this._failed = false;
        this._succeeded = false;
        this._error = null;
    }

    success() { //Public
        this._succeeded = true;
        this._saga._success(this._name);
    }

    fail(e = null) { //Public
        this._failed = true;
        this._error = e;
        this._saga._fail(this);
    }

    hasFailed() { //Public
        return this._failed;
    }

    hasSucceeded() { //Public
        return this._succeeded;
    }

    onRepair() { //Public Event
    }

    getError() { //Public
        return this._error;
    }

    getName() { //Public
        return this._name;
    }
}

//SagaStep.prototype.toString = () => this._name;
//Saga.prototype.toString = () => "[Saga]";

module.exports = {Saga: Saga};