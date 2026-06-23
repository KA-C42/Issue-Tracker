> Endpoints requiring Auth have the additional following possible responses
> - `401` — missing or invalid token
> - `403` — authenticated but not authorized (e.g. acting on a resource you don't own or contribute to)

> **Note:** This API differentiates between `403` and `404` responses when relevant.
> Unauthorized resource access would normally return '404' for security, but this project is more to 
> showcase and practice programming ability than to be a legitimate resource.

------------------------------------------------------------------------------------------

#### profiles

<details>
 <summary><code>GET</code> <code><b>/profiles/:id</b></code> <code>Finds user profile by id</code></summary>


##### Auth

- Required
- Accessible to any authenticated user


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target user's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Profile record                                |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`                            |

</details>


<details>
 <summary><code>GET</code> <code><b>/profiles</b></code> <code>Finds user profile by username or email</code></summary>


##### Auth

- Required
- Accessible to any authenticated user


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'user'    |  query    | string    | The target user's username or email  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | Profile record                                |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`                            |
> | `400`         | `application/json`                | `{"code":"MISSING_USER_QUERY"}`                            |

</details>


<details>
 <summary><code>PATCH</code> <code><b>/profiles/:id</b></code> <code>Modifies profile row (username only)</code></summary>


##### Auth
- Required 
- Auth ID and profile ID must match


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target user's id  |

##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `username` | required | string | New username |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated profile record                                |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`           |
> | `409`         | `application/json`                | `{"code":"USERNAME_CONFLICT"}`           |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/profiles/:id</b></code> <code>Soft deletes profile row, setting profiles.deactivated_at</code></summary>


##### Auth

- Required 
- Auth ID and profile ID must match


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target user's id  |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | Updated profile record                        |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`           |

</details>

------------------------------------------------------------------------------------------

#### projects

<details>
 <summary><code>POST</code> <code><b>/projects</b></code> <code>Creates a new project row</code></summary>


##### Auth

- Required
- Accessible to any authenticated user


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `name` | required | string | project name |
> | `description` | not required | string | project description |
> | `code` | required | string | Code used to prefix/identify issues in the project |

- 'name' must be unique per owner. The same name may be used across different owners.
- 'code' must be <= 4 alphanumeric characters


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created project record                       |
> | `400`         | `application/json`                | `{"code":"MISSING_PROJECT_NAME"}`          |
> | `400`         | `application/json`                | `{"code":"MISSING_PROJECT_CODE"}`           |
> | `400`         | `application/json`                | `{"code":"INVALID_CODE"}`           |
> | `409`         | `application/json`                | `{"code":"PROJECT_NAME_CONFLICT"}`          |

</details>

<details>
 <summary><code>GET</code> <code><b>/projects/:id</b></code> <code>Find project by project id</code></summary>


##### Auth

- Required
- Accessible to authenticated users that own or contribute to the given project


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Project record                       |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`           |

</details>

<details>
 <summary><code>GET</code> <code><b>/projects</b></code> <code>Find projects by authenticated user id</code></summary>


##### Auth

- Required 
- Accessible to any authenticated user


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Array of project records             |

- Owned projects appear first (sorted by `created_at`), followed by contributed projects (sorted by date joined).

</details>

<details>
 <summary><code>PATCH</code> <code><b>/projects/:id</b></code> <code>Update project record by id</code></summary>


##### Auth

- Required 
- Accessible to the project owner


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target project's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `name` | not required | string | project name |
> | `description` | not required | string | project description |
> | `code` | not required | string | Code used to prefix/identify issues in the project |

- 'name' must be unique per owner. The same name may be used across different owners.
- 'code' must be <= 4 alphanumeric characters


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated project record             |
> | `404`         | `application/json`        | `{"code":"PROJECT_NOT_FOUND"}`           |
> | `400`         | `application/json`        | `{"code":"NO_PROJECT_FIELDS_PROVIDED"}`             |
> | `400`         | `application/json`                | `{"code":"INVALID_CODE"}`           |
> | `409`         | `application/json`                | `{"code":"PROJECT_NAME_CONFLICT"}`          |


</details>

<details>
 <summary><code>DELETE</code> <code><b>/projects/:id</b></code> <code>Delete project record by id</code></summary>


##### Auth

- Required 
- Accessible to the project owner


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`        | `{"code":"PROJECT_NOT_FOUND"}`           |

</details>

------------------------------------------------------------------------------------------

#### project_contributors

<details>
 <summary><code>GET</code> <code><b>/projects/:id/contributors</b></code> <code>Find project_contributor records by project_id</code></summary>

##### Auth

- Required
- Accessible to authenticated users that own or contribute to the given project


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Array of project_contributor records                  |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`           |

</details>

<details>
 <summary><code>GET</code> <code><b>/profiles/:id/contributors</b></code> <code>Find project_contributor records by profile_id</code></summary>

##### Auth

- Required
- Accessible to the authenticated user with the given user id


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target user's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Array of project_contributor records                  |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`           |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/projects/:project_id/contributors/:user_id</b></code> <code>Delete project_contributor record by (project_id, user_id) </code></summary>


##### Auth

- Required 
- Accessible to the project owner


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'project_id'      |  path     | uuid   | The target project's id  |
> | 'user_id'      |  path     | uuid   | The target user's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`        | `{"code":"CONTRIBUTOR_NOT_FOUND"}`           |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/profiles/:user_id/contributors/:project_id</b></code> <code>Delete project_contributor record by (project_id, user_id) </code></summary>


##### Auth

- Required 
- Accessible to the authenticated user with the given user id


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'user_id'      |  path     | uuid   | The target user's id  |
> | 'project_id'      |  path     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`        | `{"code":"CONTRIBUTOR_NOT_FOUND"}`           |

</details>

------------------------------------------------------------------------------------------

#### issues

<details>
 <summary><code>POST</code> <code><b>/projects/:project_id/issues</b></code> <code>Creates a new issue row</code></summary>


##### Auth

- Required
- Accessible to any authenticated user that owns or contributes to the given project


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'project_id'      |  path     | uuid   | The target project's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `title` | required | string | issue title |
> | `details` | not required | string | issue details |
> | `status` | not required | enum | current progress/status of issue `BACKLOG` \| `IN_PROGRESS` \| `DONE` |
> | `assignee_id` | not required | uuid | project member assigned to issue |

- 'title' must be unique per project. The same title may be used across different projects.
- 'status' has a default value of 'BACKLOG'
- 'assignee_id' must be a valid project member (owner or contributor)


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created issue record                       |
> | `400`         | `application/json`                | `{"code":"MISSING_ISSUE_TITLE"}`           |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`           |
> | `404`         | `application/json`                | `{"code":"ASSIGNEE_NOT_FOUND"}`           |
> | `409`         | `application/json`                | `{"code":"ISSUE_TITLE_CONFLICT"}`         |
> | `422`         | `application/json`                | `{"code":"INVALID_ASSIGNEE"}`         |

</details>

<details>
 <summary><code>GET</code> <code><b>/projects/:project_id/issues</b></code> <code>Find issues by project id with optional filtering</code></summary>


##### Auth

- Required
- Accessible to authenticated users that own or contribute to the given project


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'project_id'  |  path     | uuid   | The target project's id  |
> | `assignee_id` | query | uuid | Optional. Filter issues by assignee |
> | `status` | query | enum | Optional. Filter by status: `BACKLOG` \| `IN_PROGRESS` \| `DONE` |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | array of issue records                     |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`          |
> | `404`         | `application/json`                | `{"code":"ASSIGNEE_NOT_FOUND"}`          |

- response is sorted by status in order of `BACKLOG` \| `IN_PROGRESS` \| `DONE` 

</details>

<details>
 <summary><code>GET</code> <code><b>/issues</b></code> <code>Find issues by assignee_id (provided by auth jwt)</code></summary>


##### Auth

- Required 
- Accessible to the authenticated user with the given user id


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | `status` | query | enum | Optional. Filter by status: `BACKLOG` \| `IN_PROGRESS` \| `DONE` |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Array of issue records             |
> | `404`         | `application/json`                | `{"code":"ASSIGNEE_NOT_FOUND"}`          |

- response is sorted by status in order of `BACKLOG` \| `IN_PROGRESS` \| `DONE` 

</details>

<details>
 <summary><code>GET</code> <code><b>/issues/:id</b></code> <code>Find issue by id</code></summary>


##### Auth

- Required 
- Accessible to any authenticated user who owns or contributes to the project the given issue belongs to 


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target issue's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | issue record             |
> | `404`         | `application/json`                | `{"code":"ISSUE_NOT_FOUND"}`          |

</details>

<details>
 <summary><code>PATCH</code> <code><b>/issues/:id</b></code> <code>Update issue record by id</code></summary>


##### Auth

- Required 
- Fully accessible to the issue creator and owner of the project issue belongs to
- Status change alone is accessible to the assignee


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target issue's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `title` | not required | string | issue title |
> | `details` | not required | string | issue details |
> | `status` | not required | enum | current progress/status of issue `BACKLOG` \| `IN_PROGRESS` \| `DONE` |
> | `assignee_id` | not required | uuid | project member assigned to issue |

- 'title' must be unique per project
- 'assignee_id' must be a valid project member or null (for removal)


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated issue record             |
> | `404`         | `application/json`        | `{"code":"ISSUE_NOT_FOUND"}`          |
> | `404`         | `application/json`        | `{"code":"ASSIGNEE_NOT_FOUND"}`          |
> | `422`         | `application/json`        | `{"code":"INVALID_ASSIGNEE"}`          |
> | `400`         | `application/json`        | `{"code":"MISSING_ISSUE_PATCH_FIELDS"}`            |
> | `409`         | `application/json`        | `{"code":"ISSUE_TITLE_CONFLICT"}`         |


</details>

<details>
 <summary><code>DELETE</code> <code><b>/issues/:id</b></code> <code>Delete issue record by id</code></summary>


##### Auth

- Required 
- Accessible to the issue creator or owner of the project the issue belongs to


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target issue's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`        | `{"code":"ISSUE_NOT_FOUND"}`          |

</details>

------------------------------------------------------------------------------------------

#### comments

<details>
 <summary><code>POST</code> <code><b>/issues/:issue_id/comments</b></code> <code>Creates a new comment row</code></summary>


##### Auth

- Required
- Accessible to users that own or contribute to the project the parent issue belongs to


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'issue_id'      |  path     | uuid   | The target issue's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `comment` | required | string | comment text |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created comment record                       |
> | `400`         | `application/json`                | `{"code":"MISSING_COMMENT_TEXT"}`          |
> | `404`         | `application/json`                | `{"code":"ISSUE_NOT_FOUND"}`          |


</details>

<details>
 <summary><code>GET</code> <code><b>/issues/:issue_id/comments</b></code> <code>Find comments by issue id</code></summary>


##### Auth

- Required
- Accessible to users that own or contribute to the project the parent issue belongs to


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'issue_id'  |  path     | uuid   | The target issue's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | array of comment records                     |
> | `404`         | `application/json`                | `{"code":"ISSUE_NOT_FOUND"}`          |

- response is ordered ascending by created_at

</details>

<details>
 <summary><code>PATCH</code> <code><b>/comments/:id</b></code> <code>Update comment record by id</code></summary>


##### Auth

- Required 
- Accessible to the comment author


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'  |  path     | uuid   | The target comment's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `comment` | required | string | comment text |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated comment record             |
> | `404`         | `application/json`                | `{"code":"COMMENT_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"MISSING_COMMENT_TEXT"}`     |


</details>

<details>
 <summary><code>DELETE</code> <code><b>/comments/:id</b></code> <code>Delete comment by id</code></summary>


##### Auth

- Required 
- Accessible to the comment author and/or the owner of the project the comment belongs to


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target comment's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`                | `{"code":"COMMENT_NOT_FOUND"}`          |


</details>

------------------------------------------------------------------------------------------

#### invitations

<details>
 <summary><code>POST</code> <code><b>/projects/:project_id/invitations</b></code> <code>Creates a new invitation row</code></summary>


##### Auth

- Required
- Accessible to users that own or contribute to the given project


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'project_id'      |  path     | uuid   | The target project's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `receiver_id` | required | uuid | target user's id |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created invitation record                       |
> | `400`         | `application/json`                | `{"code":"MISSING_RECEIVER_ID"}`          |
> | `404`         | `application/json`                | `{"code":"RECEIVER_NOT_FOUND"}`          |
> | `409`         | `application/json`                | `{"code":"INVITE_ALREADY_PENDING"}`          |
> | `409`         | `application/json`                | `{"code":"RECIPIENT_ALREADY_CONTRIBUTOR"}`   |
> | `409`         | `application/json`                | `{"code":"RECIPIENT_OWNS_PROJECT"}`   |


</details>

<details>
 <summary><code>GET</code> <code><b>/invitations</b></code> <code>Find invitations by project id or receiver id</code></summary>


##### Auth

- Required
- If searching by project id, accessible to members of the given project
- If searching by receiver id, accessible to only that user


##### Parameters

> Exactly one of the following query parameters are required
>
> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'receiver_id'  |  query     | uuid   | The target user's id  |
> | 'project_id'  |  query     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | array of invitation records                     |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`          |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"MISSING_SEARCH_PARAMETER"}`   |
> | `400`         | `application/json`                | `{"code":"TOO_MANY_PARAMETERS"}`   |


</details>

<details>
 <summary><code>PATCH</code> <code><b>/invitations/:id</b></code> <code>Update invitation record by id</code></summary>


##### Auth

- Required 
- Sender can update invitation.status from 'PENDING' to 'REVOKED'
- Recipient can update invitation.status from 'PENDING' to 'REJECTED' or 'ACCEPTED'


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'  |  path     | uuid   | The target invitation's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `status` | required | enum | invitation status: `REVOKED` \| `REJECTED` \| `ACCEPTED` |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated invitation record             |
> | `404`         | `application/json`                | `{"code":"INVITATION_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"INVALID_STATUS_VALUE"}`     |
> | `400`         | `application/json`                | `{"code":"MISSING_STATUS"}`     |
> | `409`         | `application/json`                | `{"code":"INVITATION_NOT_PENDING"}`     |

- On invitation.status change to 'ACCEPTED' a new project_contributor row is created, adding the receiver to the project

</details>

