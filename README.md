# saga-pattern
saga-pattern testing

# Install
To install the node dependencies run: ```npm install```

# Test
Running ```npm test``` will execute 11 mocha tests.

# Implement
Import the saga class from the saga.js file ```const Saga = require('./saga')```.

Saga class public interface:

```saga.begin({name: string}): SagaStep``` will create a new instance of SagaStep and bind it to this Saga transaction. Every step should represent a atomic mutation in the transaction. Begin can be passed an optional argument object which cn be used to set a custom name to the step.

```saga.onFinallyFailed(callback: function): void``` will add a callback listener to the Saga transaction. The callbacks are triggered when the Saga transaction has completed but one or more steps failed.

```saga.onFinallySucceeded(callback: function): void``` will add a callback listener to the Saga transaction. The callbacks are triggered when the Saga transaction has completed and all steps where successful.

```saga.onStepFailed(callback: function): void``` will add a callback listener to the Saga transaction. The callbacks are triggered when any step fail.

```saga.onStepSucceeded(callback: function): void``` will add a callback listener to the Saga transaction. The callbacks are triggered when any step is completed and successful.

Any callback event listeners should be registred with the four above functions before calling begin().

```saga.hasFailed(): boolean``` will return a boolean value on whether or not any step in the transaction has failed

The following is an example on how to apply the Saga pattern to a simple transaction:

```
const Saga = require('./saga')
const saga = new Saga();
```
