/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { AddBillingMeterEventParams, StripeClient } from "../../src/type";
import { BILLING_METER_EVENT_NAME } from "../../src/consts";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@authz[utils/addBillingMeterEvent]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("sends a billing meter event to stripe", async function () {
    // Arrange
    const { makeAddBillingMeterEvent } = await import(
      "../../src/utils/makeAddBillingMeterEvent"
    );
    const stripe = {
      billing: {
        meterEvents: {
          create: sandbox.stub().resolves({})
        }
      }
    } as StripeClient;

    const addBillingMeterEvent = makeAddBillingMeterEvent(stripe);
    const params = {
      value: "100",
      stripeCustomerId: "123",
      identifier: "123"
    };

    // Act
    await addBillingMeterEvent(params as AddBillingMeterEventParams);

    // Assert
    expect(stripe.billing.meterEvents.create).to.have.been.calledOnce;
    expect(stripe.billing.meterEvents.create).to.have.been.calledWith({
      event_name: BILLING_METER_EVENT_NAME,
      payload: {
        value: "100",
        stripe_customer_id: "123"
      },
      identifier: "123"
    });
  });

  it("throws an error if stripe throws an error", async function () {
    // Arrange
    const { makeAddBillingMeterEvent } = await import(
      "../../src/utils/makeAddBillingMeterEvent"
    );
    const stripe = {
      billing: {
        meterEvents: {
          create: sandbox.stub().rejects(new Error("stripe error"))
        }
      }
    } as StripeClient;

    const addBillingMeterEvent = makeAddBillingMeterEvent(stripe);
    const params = {
      value: "100",
      stripeCustomerId: "123",
      identifier: "123"
    };

    // Act
    const promise = addBillingMeterEvent(params as AddBillingMeterEventParams);

    // Assert
    return expect(promise).to.be.rejectedWith("stripe error");
  });
});
