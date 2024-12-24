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
const CREATE_WORKSPACE_METHOD = "/fonoster.identity.v1beta2.Identity/CreateWorkspace";
const CREATE_CALL_METHOD = "/fonoster.calls.v1beta2.Calls/CreateCall";
const CREATE_DOMAIN_METHOD = "/fonoster.domains.v1beta2.Domains/CreateDomain";
const BILLING_METER_EVENT_NAME = "call_seconds";

export {
  CREATE_WORKSPACE_METHOD, CREATE_CALL_METHOD, CREATE_DOMAIN_METHOD, BILLING_METER_EVENT_NAME
};