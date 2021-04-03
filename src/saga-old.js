class Saga {
    constructor() {
        this.failed = false;
        this.listeners = {};
        this.entries = {};
    }

    begin(name, promise) {
        if(this.entries[name])
            throw "Saga step with name '" + name + "' already exist";
        this.entries[name] = new SagaEntry(name, promise)
        return promise;
    }

    onFailed(name, event) {
        this.listeners[name] = event;
    }

    fail(name) {
        this.failed = true;
        if(!this.entries[name])
            return;

        this.entries[name].fail();
        
        if(!this.listeners[name])
            return;
        this.listeners[name](this.entries[name]);
    }
}

class SagaEntry {
    constructor(name, promise) {
        this.name = name;
        this.promise = promise;
        this.failed = false;
    }

    fail() {
        this.failed = true;
    }

    hasFailed() {
        return this.failed;
    }
}