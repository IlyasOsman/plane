import { ConnectionConfiguration } from "@hocuspocus/server";
// services
import { UserService } from "../services/user.service.js";
// types
import { TDocumentTypes } from "../types/common.js";

const userService = new UserService();

type Props = {
  connection: ConnectionConfiguration;
  cookie: string;
  params: URLSearchParams;
  token: string;
};

export const handleAuthentication = async (props: Props) => {
  const { connection, cookie, params, token } = props;
  // params
  const workspaceSlug = params.get("workspaceSlug")?.toString();
  const projectId = params.get("projectId")?.toString();
  const documentType = params.get("documentType")?.toString() as
    | TDocumentTypes
    | undefined;
  // fetch current user info
  let response;
  try {
    response = await userService.currentUser(cookie);
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    throw error;
  }
  if (response.id !== token) {
    throw Error("Authentication failed: Token doesn't match the current user.");
  }

  if (documentType === "project_page") {
    if (!workspaceSlug || !projectId) {
      throw Error(
        "Authentication failed: Incomplete query params. Either workspaceSlug or projectId is missing."
      );
    }
    // fetch current user's project membership info
    const projectMembershipInfo = await userService.getUserProjectMembership(
      workspaceSlug,
      projectId,
      cookie
    );
    const projectRole = projectMembershipInfo.role;
    // make the connection read only for roles lower than a member
    if (projectRole < 15) {
      connection.readOnly = true;
    }
  } else {
    throw Error("Authentication failed: Invalid document type provided.");
  }

  return {
    user: {
      id: response.id,
      name: response.display_name,
    },
  };
};