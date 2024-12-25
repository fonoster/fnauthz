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
import {
  AuthzHandler as IAuthzHandler,
  AddBillingMeterEventRequest,
  CheckMethodAuthorizedRequest,
  VoiceRequest
} from "@fonoster/authz";
import { createGetUserByWorkspaceAccessKeyId, prisma } from "@fonoster/identity";
import { getExtended } from "./utils/getExtended";
import { AccountType } from "./type";
import { CREATE_CALL_METHOD, CREATE_WORKSPACE_METHOD } from "./consts";
import { makeGetWorkspacesCount, makeAddBillingMeterEvent } from "./utils";

import { STRIPE_SECRET_KEY } from "./envs";

const logger = getLogger({ service: "fnauthz", filePath: __filename });
const getUserByWorkspaceAccessKeyId = createGetUserByWorkspaceAccessKeyId(prisma);
const getWorkspacesCount = makeGetWorkspacesCount(prisma);

const stripe = require("stripe");
const addBillingMeterEvent = makeAddBillingMeterEvent(stripe(STRIPE_SECRET_KEY));

// TODO: Should use Zod to validate all the requests
// TODO: We should really do unit tests for this
class AuthzHandler implements IAuthzHandler {
  // If calling is enabled the account is in good standing and the session is authorized
  async checkSessionAuthorized(request: VoiceRequest): Promise<boolean> {
    logger.verbose("checkSessionAuthorized called", request);

    const user = await getUserByWorkspaceAccessKeyId(request.accessKeyId);

    if (!user) {
      return false;
    }

    logger.verbose("checkSessionAuthorized user extended data", { extended: user.extended });

    return (getExtended(user.extended))?.callingEnabled;
  }

  // PRO and ENTERPRISE accounts can use all methods as long as calling is enabled
  // FREE accounts can only have 1 Domain and 1 Workspace
  async checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean> {
    logger.verbose("checkMethodAuthorized called", request);

    const user = await getUserByWorkspaceAccessKeyId(request.accessKeyId);

    if (!user) {
      return false;
    }

    logger.verbose("checkMethodAuthorized user extended data", { extended: user?.extended });

    const { accountType, callingEnabled } = (getExtended(user.extended))
    const { method } = request;

    if (method === CREATE_CALL_METHOD) {
      return callingEnabled;
    } else if (accountType !== AccountType.STARTER && method !== CREATE_CALL_METHOD) {
      return true;
    }

    if (method === CREATE_WORKSPACE_METHOD) {
      return await getWorkspacesCount(user.ref) < 1;
    }

    // TODO: Add check for CREATE_DOMAIN_METHOD

    // All other methods are allowed for FREE accounts
    return true;
  }

  async addBillingMeterEvent(
    request: AddBillingMeterEventRequest
  ): Promise<void> {
    logger.verbose("addBillingMeterEvent called", request);
    const user = await getUserByWorkspaceAccessKeyId(request.accessKeyId);

    if (!user) {
      logger.error("addBillingMeterEvent user not found", request);
      return;
    }

    logger.verbose("addBillingMeterEvent user extended data", { extended: user.extended });

    const { stripeCustomerId } = 
      (user.extended as { stripeCustomerId: string, duration: string });

    const { duration: value } = request.payload as { duration: string };

    await addBillingMeterEvent({
      stripeCustomerId,
      value
    });
  }
}

export { AuthzHandler };
