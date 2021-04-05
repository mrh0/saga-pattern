/* 
Saga Options: {
    preventFailedBegining (true) : Throw error when calling begin() after the Saga has failed
} 
*/

class Saga {
    constructor(options = {preventFailedBegining: true}) {
        this.failed = false;
        this.succeeded = false;
        this.entries = [];
        this.opts = options;
    }

    begin({name} = {}) { //Public
        if(this.opts.preventFailedBegining && this.hasFailed())
            throw "Can't begin(): The saga has already failed.";
        let se = new SagaEntry(name || ("step#" + this.entries.length), this);
        this.entries.push(se);
        return se;
    }

    fail(name) { //Private
        this.failed = true;
        if(name)
            this.onStepFailed({failedStep: name});
        let failedSteps = [];
        for(let entry of this.entries) {
            if(!entry.hasFailed() && !entry.hasSucceeded())
                return;
            if(entry.hasFailed())
                failedSteps.push(entry.name);
        }
        for(let entry of this.entries)
            if(entry.hasSucceeded())
                entry.onRepair();
        this.onFinallyFailed({failedSteps: failedSteps});
    }

    success(name) { //Private
        for(let entry of this.entries)
            if(entry.hasFailed())
                return this.fail(null);

        for(let entry of this.entries)
            if(!entry.hasSucceeded())
                return;
        this.succeeded = true;
        this.onFinallySucceeded({});
    }

    hasFailed() { //Public
        return this.failed;
    }

    onFinallyFailed(evt) {} //Public Event

    onFinallySucceeded(evt) {} //Public Event

    onStepFailed(evt) {} //Public Event

    // Make promise versions
}

class SagaEntry {
    constructor(name, saga) {
        this.name = name;
        this.saga = saga;
        this.failed = false;
        this.succeeded = false;
        this.error = null;
    }

    success() { //Public
        this.succeeded = true;
        this.saga.success(this.name);
    }

    fail(e = null) { //Public
        this.failed = true;
        this.error = e;
        this.saga.fail(this.name);
    }

    hasFailed() { //Public
        return this.failed;
    }

    hasSucceeded() { //Public
        return this.succeeded;
    }

    onRepair() { //Public Event
    }

    getError() { //Public
        return this.error;
    }
}

module.exports = {Saga: Saga};