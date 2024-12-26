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
import { getLogger } from "@fonoster/logger";
import { NatsConnection } from "nats";

const logger = getLogger({ service: "fnauthz", filePath: __filename });

async function watchNatsStatus(nc: NatsConnection) {
  for await (const s of nc.status()) {
    if (s.type === "disconnect") {
      logger.error("disconnected from NATS");
    } else if (s.type === "reconnect") {
      logger.info("reconnected to NATS");
    } else if (s.type === "reconnecting") {
      logger.warn("reconnecting to NATS");
    }
  }
}

export { watchNatsStatus };
