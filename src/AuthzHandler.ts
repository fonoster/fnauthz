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
import {
  createGetUserByWorkspaceAccessKeyId,
  prisma
} from "@fonoster/identity";
import { AccountType } from "./type";
import { CREATE_CALL_METHOD, CREATE_WORKSPACE_METHOD } from "./consts";
import { makeGetWorkspacesCount, makeAddBillingMeterEvent } from "./utils";
import Stripe from "stripe";
import { STRIPE_SECRET_KEY } from "./envs";
import {
  addBillingMeterEventRequestSchema,
  checkMethodAuthorizedRequestSchema,
  userExtendedSchema,
  voiceRequestSchema
} from "./schema";

const logger = getLogger({ service: "fnauthz", filePath: __filename });
const getUserByWorkspaceAccessKeyId =
  createGetUserByWorkspaceAccessKeyId(prisma);
const getWorkspacesCount = makeGetWorkspacesCount(prisma);
const addBillingMeterEvent = makeAddBillingMeterEvent(
  new Stripe(STRIPE_SECRET_KEY!)
);

class AuthzHandler implements IAuthzHandler {
  // If calling is enabled the account is in good standing and the session is authorized
  async checkSessionAuthorized(request: VoiceRequest): Promise<boolean> {
    logger.verbose("checkSessionAuthorized called", request);

    // Checks if request at leas has the accessKeyId
    const parsedRequest = voiceRequestSchema.parse(request);

    const user = await getUserByWorkspaceAccessKeyId(parsedRequest.accessKeyId);

    if (!user) {
      return false;
    }

    // Checks if user has the extended field
    const parsedUser = userExtendedSchema.parse(user);

    logger.verbose("checkSessionAuthorized user extended data", {
      extended: parsedUser.extended
    });

    return parsedUser.extended.callingEnabled;
  }

  // PRO and ENTERPRISE accounts can use all methods as long as calling is enabled
  // STARTER accounts can only have 1 Domain and 1 Workspace
  async checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean> {
    logger.verbose("checkMethodAuthorized called", request);

    // Must have both accessKeyId and method
    const parsedRequest = checkMethodAuthorizedRequestSchema.parse(request);

    const user = await getUserByWorkspaceAccessKeyId(parsedRequest.accessKeyId);

    if (!user) {
      return false;
    }

    // Checks if user has the extended field
    const parsedUser = userExtendedSchema.parse(user);

    logger.verbose("checkMethodAuthorized user extended data", {
      extended: parsedUser.extended
    });

    const { accountType, callingEnabled } = parsedUser.extended;
    const { method } = request;

    if (method === CREATE_CALL_METHOD) {
      return callingEnabled;
    } else if (
      accountType !== AccountType.STARTER &&
      method !== CREATE_CALL_METHOD
    ) {
      return true;
    }

    if (method === CREATE_WORKSPACE_METHOD) {
      return (await getWorkspacesCount(parsedUser.ref)) < 1;
    }

    // TODO: Add check for CREATE_DOMAIN_METHOD

    // STARTER accounts have access to all other methods
    return true;
  }

  async addBillingMeterEvent(
    request: AddBillingMeterEventRequest
  ): Promise<void> {
    logger.verbose("addBillingMeterEvent called", request);

    // Must have the accessKeyId and a payload with value, identifier and duration
    const parsedRequest = addBillingMeterEventRequestSchema.parse(request);

    const user = await getUserByWorkspaceAccessKeyId(parsedRequest.accessKeyId);

    if (!user) {
      logger.error("addBillingMeterEvent user not found", request);
      return;
    }

    // Checks if user has the extended field
    const parsedUser = userExtendedSchema.parse(user);

    logger.verbose("addBillingMeterEvent user extended data", {
      extended: parsedUser.extended
    });

    const { stripeCustomerId } = parsedUser.extended;

    const { value, identifier } = request.payload;

    await addBillingMeterEvent({
      stripeCustomerId,
      value: `${value}`,
      identifier
    });
  }
}

export { AuthzHandler };
