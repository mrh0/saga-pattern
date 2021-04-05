let {Saga} = require("./src/saga");

// Waits for (ms) milliseconds then resolves promise
function waitFor(ms, passthrough = null){
    return new Promise((resolve) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        resolve(passthrough)
      }, ms)
    })
}

async function test() {
    console.log("start");

    // Create a Saga
    let saga = new Saga();

    // Any step failed when all are done
    saga.onFinallyFailed = (e) => {
        console.log("BAD", e);
    }

    // A step failed
    saga.onStepFailed = (e) => {
        console.log("BAD", e);
    }

    // All steps succeeded
    saga.onFinallySucceeded = (e) => {
        console.log("OK");
    }

    // Start three Saga steps
    let step0 = saga.begin({name: "first step"});
    let step1 = saga.begin();
    let step2 = saga.begin();
    let step3 = saga.begin();

    // Define repair event
    step0.onRepair = () => console.log("repair0");
    // Wait then fail using 'then'
    waitFor(100).then(() => {throw "error"}).catch((e) => step0.fail(e));

    // Define repair event
    step1.onRepair = () => console.log("repair1");
    // Wait then succeed using 'then'
    waitFor(100).then(() => step1.success()).catch((e) => step1.fail(e));

    // Define repair event
    step2.onRepair = () => console.log("repair2");
    // Wait then succeed using 'await'
    await waitFor(100)
    try {
        step2.success();
    }
    catch(e) {
        step2.fail(e);
    }

    // Define repair event
    step3.onRepair = () => console.log("repair3");
    // Wait then fail using 'await'
    await waitFor(100)
    try {
        throw "error";
    }
    catch(e) {
        step3.fail(e);
    }

    console.log("end");
}

test();
