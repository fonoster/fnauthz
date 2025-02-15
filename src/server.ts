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
import {
  assertEnvsAreSet,
  createFetchSingleCallByCallId
} from "@fonoster/common";
import { AuthzServer } from "@fonoster/authz";
import { AuthzHandler } from "./AuthzHandler";
import { connect } from "nats";
import { getLogger } from "@fonoster/logger";
import { INFLUXDB_TOKEN, INFLUXDB_URL, NATS_URL } from "./envs";
import { ROUTR_CALL_SUBJECT } from "./consts";
import { watchNatsStatus } from "./utils/watchNatsStatus";
import { InfluxDB } from "@influxdata/influxdb-client";

assertEnvsAreSet([
  "FNAUTHZ_STRIPE_SECRET_KEY",
  "FNAUTHZ_INFLUXDB_URL",
  "FNAUTHZ_INFLUXDB_TOKEN",
  "FNAUTHZ_NATS_URL",
  "FNAUTHZ_CLOAK_ENCRYPTION_KEY",
  "FNAUTHZ_IDENTITY_DATABASE_URL"
]);

const authzHandler = new AuthzHandler();
new AuthzServer().listen(authzHandler);

const influx = new InfluxDB({ url: INFLUXDB_URL!, token: INFLUXDB_TOKEN });
// TODO: Fix hardcode value
const fetchSingleCallByCallId = createFetchSingleCallByCallId(
  influx.getQueryApi("fonoster")
);

const logger = getLogger({ service: "fnauthz", filePath: __filename });

connect({ servers: NATS_URL, maxReconnectAttempts: -1 }).then(async (nc) => {
  logger.info("connected to NATS");

  const subscription = nc.subscribe(ROUTR_CALL_SUBJECT);

  subscription.callback = async (err, msg) => {
    if (err) {
      logger.error(err);
    }

    const { callId } = msg.json() as { callId: string };

    try {
      const callDetails = await fetchSingleCallByCallId(callId);

      if (!callDetails) {
        logger.warn(
          `call details not found while processing billing event for call ${callId}`
        );
        return;
      } else if (!callDetails.status) {
        // Call is still in progress
        return;
      }

      const { accessKeyId, ref: identifier, duration: value } = callDetails;

      logger.verbose(`processing billing event for call ${callId}`, {
        accessKeyId,
        identifier,
        value
      });

      await authzHandler.addBillingMeterEvent({
        accessKeyId,
        payload: { identifier, value }
      });

      logger.verbose(`billing event processed for call ${callId}`);
    } catch (e) {
      console.log(e);
      logger.error(`error processing billing event for call ${callId}: ${e}`);
    }
  };

  watchNatsStatus(nc);
});
