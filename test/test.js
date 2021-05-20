const {Saga} = require("../src/saga");
const assert = require('assert');

function waitFor(ms) {
	return new Promise((resolve) => {
		let id = setTimeout(() => {
			clearTimeout(id);
			resolve();
		}, ms);
	});
}

describe('Saga', () => {
	describe('tests that saga step is created', () => {
		let saga = new Saga();
		it('should create a step with a name', () => {
			let step = saga.begin({name: "test"});
			assert.strictEqual(saga._entries[0], step);
			assert.strictEqual(saga._entries[0].getName(), "test");
		});
	});

	describe('tests saga with one step', () => {
		it('should call onStepFailed', (done) => {
			let saga = new Saga();
			saga.onStepFailed((e) => {
				assert.strictEqual(e.failedStep.name, "test");
				assert.strictEqual(e.failedStep.error, "error message");
				done();
			});

			let step = saga.begin({name: "test"});
			step.fail("error message");
		});
		
		it('should call onFinallyFailed', (done) => {
			let saga = new Saga();
			saga.onFinallyFailed((e) => {
				assert.strictEqual(e.failedSteps.length, 1);
				assert.strictEqual(e.failedSteps[0].name, "step#0");
				assert.strictEqual(e.failedSteps[0].error, "error message");
				done();
			});

			let step = saga.begin();
			step.fail("error message");
		});

		it('should call onFinallySucceeded', (done) => {
			let saga = new Saga();
			saga.onFinallySucceeded(() => done());

			let step = saga.begin();
			step.success();
		});
	});

	describe('tests saga with asynchronous promise', () => {
		it('should complete asynchronous step', (done) => {
			let saga = new Saga();

			let step = saga.begin();
			waitFor(10).then(() => step.success());

			saga.promise().then(() => done());
		});

		it('should catch asynchronous step', (done) => {
			let saga = new Saga();

			let step = saga.begin();
			waitFor(10).then(() => step.fail());

			saga.promise().catch(() => done());
		});
	});

	describe('tests saga with two steps', () => {
		it('should call onStepFailed on asynchronous steps', (done) => {
			let saga = new Saga();
			saga.onStepFailed((e) => {
				assert.strictEqual(e.failedStep.name, "test2");
				assert.strictEqual(e.failedStep.error, "error message 2");
				done();
			});

			let step1 = saga.begin({name: "test1"});
			let step2 = saga.begin({name: "test2"});

			waitFor(10).then(() => step1.success("error message 1"));
			waitFor(10).then(() => step2.fail("error message 2"));
		});
		
		it('should call onFinallyFailed on asynchronous steps', (done) => {
			let saga = new Saga();
			saga.onFinallyFailed((e) => {
				assert.strictEqual(e.failedSteps.length, 1);
				assert.strictEqual(e.failedSteps[0].name, "step#0");
				assert.strictEqual(e.failedSteps[0].error, "error message 1");
				done();
			});

			let step1 = saga.begin();
			let step2 = saga.begin();

			waitFor(10).then(() => step1.fail("error message 1"));
			waitFor(10).then(() => step2.success("error message 2"));
		});

		it('should call onFinallySucceeded on asynchronous steps', (done) => {
			let saga = new Saga();

			let flag = 0;

			saga.onFinallySucceeded(() => flag++);
			saga.onFinallySucceeded(() => {
				assert.strictEqual(flag, 1);
				done();
			});

			let step1 = saga.begin();
			let step2 = saga.begin();

			waitFor(10).then(() => step1.success());
			waitFor(10).then(() => step2.success());
		});

		it('should call onRepair on asynchronous step', (done) => {
			let saga = new Saga();

			let step1 = saga.begin();
			let step2 = saga.begin();

			step1.onRepair(() => done());

			waitFor(10).then(() => step1.success());
			waitFor(10).then(() => step2.fail());
		});

		it('should call onFailedRepair on asynchronous step', (done) => {
			let saga = new Saga({reportFailedRepair: false});

			let step1 = saga.begin();
			let step2 = saga.begin();

			step1.onRepair(() => { throw "error" });
			step1.onFailedRepair(() => done());

			waitFor(10).then(() => step1.success());
			waitFor(10).then(() => step2.fail());
		});

		it('should complete all events', (done) => {
			let saga = new Saga({reportFailedRepair: false});

			let step1 = saga.begin();
			let step2 = saga.begin();

			let flag = 0;

			saga.onStepFailed(() => flag++);
			saga.onStepFailed(() => flag++);

			saga.onStepSucceeded(() => flag++);
			saga.onStepSucceeded(() => flag++);

			step1.onRepair(() => { flag++ });
			step1.onRepair(() => { throw "error" });

			step1.onFailedRepair(() => flag++);
			step1.onFailedRepair(() => flag++);

			saga.onFinallyFailed(() => flag++);
			saga.onFinallyFailed(() => {
				assert.strictEqual(flag, 8);
				done();
			});

			waitFor(10).then(() => step1.success());
			waitFor(10).then(() => step2.fail());
		});

		it('should return correct step error', (done) => {
			let saga = new Saga({reportFailedRepair: false});

			saga.onFinallyFailed((evt) => {
				let steps = evt.failedSteps;
				assert.strictEqual(steps.length, 2);
				assert.deepStrictEqual(steps[0], { error: 'test error 1', name: 'step A' });
				assert.deepStrictEqual(steps[1], { error: 'test error 2', name: 'step#2' });
				done();
			})

			let step1 = saga.begin();
			let step2 = saga.begin({name: 'step A'});
			let step3 = saga.begin();

			waitFor(10).then(() => step1.success());
			waitFor(10).then(() => step2.fail("test error 1"));
			waitFor(10).then(() => step3.fail("test error 2"));
		});
	});
});