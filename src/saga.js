/* 
Saga Options: {
    preventFailedBegining (true) : Throw error when calling begin() after the Saga has failed
} 
*/

class Saga {
    constructor(options = {preventFailedBegining: true}) {
        this.failed = false;
        this.entries = [];
        this.opts = options;
    }

    begin(name) {
        if(this.opts.preventFailedBegining && this.hasFailed())
            throw "Can't begin(): The saga has already failed.";
        let se = new SagaEntry(name || ("step#" + this.entries.length), this);
        return this.entries.push(se);
    }

    fail(name) {
        this.failed = true;
        onStepFailed({failedStep: name});
        let failedSteps = [];
        for(let entry of entries) {
            if(!entry.hasFailed() && !entry.hasSucceeded())
                return;
            if(entry.hasFailed())
                failedSteps.push(entry.name);
        }
        for(let entry of entries)
            if(entry.hasSucceeded())
                entry.onFailed();
        this.onFinallyFailed({failedSteps: failedSteps});
    }

    hasFailed() {
        return this.failed;
    }

    onFinallyFailed(evt) {}

    onStepFailed(evt) {}
}

class SagaEntry {
    constructor(name, saga) {
        this.name = name;
        this.saga = saga;
        this.failed = false;
        this.succeeded = false;
        this.repairListener = () => {};
    }

    success() {
        this.succeeded = true;
    }

    fail() {
        this.saga.fail(this.name);
        this.failed = true;
    }

    hasFailed() {
        return this.failed;
    }

    hasSucceeded() {
        return this.succeeded;
    }

    onRepair(callback) {
        this.repairListener = callback;
        return this;
    }
}