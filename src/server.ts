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
import { assertEnvsAreSet } from "@fonoster/common";
import { AuthzServer } from "@fonoster/authz";
import { AuthzHandler } from "./AuthzHandler";
import { connect } from "nats";
import { getLogger } from "@fonoster/logger";
import { NATS_URL } from "./envs";
import { ROUTR_CALL_SUBJECT } from "./consts";
import { watchNatsStatus } from "./utils/watchNatsStatus";

assertEnvsAreSet([
  "CLOAK_ENCRYPTION_KEY",
  "IDENTITY_DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "NATS_URL"
]);

const authzHandler = new AuthzHandler();
new AuthzServer().listen(authzHandler);

const logger = getLogger({ service: "fnauthz", filePath: __filename });

connect({ servers: NATS_URL, maxReconnectAttempts: -1 }).then(async (nc) => {
  logger.info("connected to NATS");

  const subscription = nc.subscribe(ROUTR_CALL_SUBJECT);

  subscription.callback = async (err, msg) => {
    if (err) {
      logger.error(err);
    }

    // TODO: Implement the add billing meter logic here
    logger.info("received a new call request", {
      ...msg.json()
    });
  };

  watchNatsStatus(nc);
});

