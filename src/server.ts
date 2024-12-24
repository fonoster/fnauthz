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
import { getLogger } from "@fonoster/logger";
import { AuthzServer } from "@fonoster/authz";
import { AuthzHandler } from "./AuthzHandler";

const logger = getLogger({ service: "authz", filePath: __filename });

assertEnvsAreSet([
  "CLOAK_ENCRYPTION_KEY", 
  "IDENTITY_DATABASE_URL", 
  "STRIPE_SECRET_KEY"
]);

new AuthzServer().listen(new AuthzHandler());