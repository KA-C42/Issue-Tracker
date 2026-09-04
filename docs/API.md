> Endpoints requiring Auth have the additional following possible responses
> - `401` — missing or invalid token
> - `403` — authenticated but not authorized (e.g. acting on a resource you don't own or contribute to)

------------------------------------------------------------------------------------------

#### me

> All `/me` routes resolve to the authenticated user via the JWT — no id parameter or query filter required, and they always act on the caller's own data.

<details>
 <summary><code>GET</code> <code><b>/me/profile</b></code> <code>Finds profile of authenticated user</code></summary>

##### Auth

- Required
- Accessible to any authenticated user

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Profile record                                |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`                            |

</details>

<details>
 <summary><code>PATCH</code> <code><b>/me/profile</b></code> <code>Modifies profile row (username only)</code></summary>

##### Auth
- Required 
- Accessible to any authenticated user

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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`           |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/me/profile</b></code> <code>Soft deletes profile row, setting profiles.deactivated_at</code></summary>

##### Auth

- Required 
- Accessible to any authenticated user

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | Updated profile record                        |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`           |

</details>

<details>
 <summary><code>GET</code> <code><b>/me/projects</b></code> <code>Find all projects the authenticated user either owns or contributes to</code></summary>

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
 <summary><code>GET</code> <code><b>/me/issues</b></code> <code>Find issues assigned to authenticated user</code></summary>

##### Auth

- Required 
- Accessible to any authenticated user

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Array of issue records             |

- response is sorted by status in order of `BACKLOG` \| `IN_PROGRESS` \| `DONE`, then by `modified_at`

</details>

<details>
 <summary><code>GET</code> <code><b>/me/invites</b></code> <code>Find invites where authenticated user is recipient</code></summary>

##### Auth

- Required 
- Accessible to any authenticated user

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Array of invite records             |

</details>

<details>
 <summary><code>PATCH</code> <code><b>/me/invites/:id</b></code> <code>Respond to an invite as recipient</code></summary>

##### Auth

- Required 
- Accessible to the invite's recipient

##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'  |  path     | uuid   | The target invite's id  |

##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `status` | required | enum | invite status: `ACCEPTED` \| `REJECTED` |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated invite record             |
> | `404`         | `application/json`        | `{"code":"INVITE_NOT_FOUND"}`          |
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`            |

</details>

<details>
 <summary><code>GET</code> <code><b>/me/contributors</b></code> <code>Finds project_contributor records for authenticated user</code></summary>

##### Auth

- Required
- Accessible to any authenticated user

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | Array of project_contributor records                  |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`                            |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/me/contributors/:project_id</b></code> <code>Removes authenticated user as a contributor from a project</code></summary>

##### Auth

- Required
- Accessible to any authenticated user

##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'project_id'      |  path     | uuid   | The target project's id  |

##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`                | `{"code":"CONTRIBUTOR_NOT_FOUND"}`                            |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`                            |

</details>


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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`                            |

</details>


<details>
 <summary><code>GET</code> <code><b>/profiles</b></code> <code>Finds user profile by username</code></summary>


##### Auth

- Required
- Accessible to any authenticated user


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'user'    |  query    | string    | The target user's username  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`                | Profile record                                |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`                            |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`                            |

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
> | `title` | required | string | project title |
> | `description` | not required | string | project description |
> | `code` | required | string | Code used to prefix/identify issues in the project |

- 'title' must be unique per creator. The same title may be used across different creators.
- 'code' must be exactly 4 characters


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created project record                       |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |
> | `409`         | `application/json`                | `{"code":"PROJECT_TITLE_CONFLICT"}`          |

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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`           |

</details>

<details>
 <summary><code>PATCH</code> <code><b>/projects/:id</b></code> <code>Update project record by id</code></summary>


##### Auth

- Required 
- Accessible to the project creator


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target project's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `title` | not required | string | project title |
> | `description` | not required | string | project description |
> | `code` | not required | string | Code used to prefix/identify issues in the project |

- 'title' must be unique per creator. The same title may be used across different creators.
- 'code' must be exactly 4 characters


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated project record             |
> | `404`         | `application/json`        | `{"code":"PROJECT_NOT_FOUND"}`           |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`           |
> | `409`         | `application/json`                | `{"code":"PROJECT_TITLE_CONFLICT"}`          |


</details>

<details>
 <summary><code>DELETE</code> <code><b>/projects/:id</b></code> <code>Delete project record by id</code></summary>


##### Auth

- Required 
- Accessible to the project creator


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`        | `{"code":"PROJECT_NOT_FOUND"}`           |
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`           |

</details>


------------------------------------------------------------------------------------------

#### project_contributors

<details>
 <summary><code>GET</code> <code><b>/projects/:id/contributors</b></code> <code>Find project_contributor records by project id</code></summary>

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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`           |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/projects/:project_id/contributors/:user_id</b></code> <code>Delete project_contributor record by (project_id, user_id)</code></summary>


##### Auth

- Required 
- Accessible to the project creator


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
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`           |

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
- 'assignee_id' must be a valid project member (creator or contributor)


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created issue record                       |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`           |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`           |
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
> | `project_id`  |  path     | uuid   | The target project's id  |
> | `assignee_id` | query | uuid | Optional. Filter issues by assignee |
> | `status` | query | enum | Optional. Filter by status: `BACKLOG` \| `IN_PROGRESS` \| `DONE` |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | array of issue records                     |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |

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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |

</details>

<details>
 <summary><code>PATCH</code> <code><b>/issues/:id</b></code> <code>Update issue record by id</code></summary>


##### Auth

- Required 
- Accessible to the issue creator and creator of the project the issue belongs to


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
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`            |
> | `409`         | `application/json`        | `{"code":"ISSUE_TITLE_CONFLICT"}`         |
> | `422`         | `application/json`        | `{"code":"INVALID_ASSIGNEE"}`          |


</details>

<details>
 <summary><code>PATCH</code> <code><b>/issues/:id/status</b></code> <code>Update issue status by id</code></summary>


##### Auth

- Required 
- Accessible to the issue creator, project creator, and current assignee


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target issue's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `status` | required | enum | current progress/status of issue `BACKLOG` \| `IN_PROGRESS` \| `DONE` |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated issue record             |
> | `404`         | `application/json`        | `{"code":"ISSUE_NOT_FOUND"}`          |
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`            |

</details>

<details>
 <summary><code>PATCH</code> <code><b>/issues/:id/assignee</b></code> <code>Update issue assignee by id</code></summary>


##### Auth

- Required
- Accessible to the issue creator and project creator
- Accessible to any project member, to claim the issue for themselves, if currently unassigned
- Accessible to the current assignee, to remove themselves (setting assignee_id to null)


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target issue's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `assignee_id` | required | uuid \| null | project member to assign, or null to remove the current assignee |

- 'assignee_id' must be a valid project member (creator or contributor) or null


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated issue record             |
> | `404`         | `application/json`        | `{"code":"ISSUE_NOT_FOUND"}`          |
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`            |
> | `422`         | `application/json`        | `{"code":"INVALID_ASSIGNEE"}`          |

</details>

<details>
 <summary><code>DELETE</code> <code><b>/issues/:id</b></code> <code>Delete issue record by id</code></summary>


##### Auth

- Required 
- Accessible to the issue creator or creator of the project the issue belongs to


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target issue's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`        | `{"code":"ISSUE_NOT_FOUND"}`          |
> | `400`         | `application/json`        | `{"code":"VALIDATION_ERROR"}`          |

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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |
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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |

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
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`     |


</details>

<details>
 <summary><code>DELETE</code> <code><b>/comments/:id</b></code> <code>Delete comment by id</code></summary>


##### Auth

- Required 
- Accessible to the comment author and/or the creator of the project the comment belongs to


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'      |  path     | uuid   | The target comment's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `204`         | no content        | no content             |
> | `404`         | `application/json`                | `{"code":"COMMENT_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |


</details>

------------------------------------------------------------------------------------------

#### invites

<details>
 <summary><code>POST</code> <code><b>/projects/:project_id/invites</b></code> <code>Creates a new invite row</code></summary>


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
> | `recipient_id` | required | uuid | target user's id |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `201`         | `application/json`        | Newly created invite record                       |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`          |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`          |
> | `404`         | `application/json`                | `{"code":"USER_NOT_FOUND"}`          |
> | `409`         | `application/json`                | `{"code":"INVITE_ALREADY_PENDING"}`          |
> | `409`         | `application/json`                | `{"code":"RECIPIENT_ALREADY_CONTRIBUTOR"}`   |
> | `409`         | `application/json`                | `{"code":"RECIPIENT_OWNS_PROJECT"}`   |


</details>

<details>
 <summary><code>GET</code> <code><b>/projects/:project_id/invites</b></code> <code>Find invites by project id</code></summary>


##### Auth

- Required
- Accessible to authenticated users that own or contribute to the given project


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'project_id'  |  path     | uuid   | The target project's id  |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | array of invite records                     |
> | `404`         | `application/json`                | `{"code":"PROJECT_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`   |


</details>

<details>
 <summary><code>PATCH</code> <code><b>/invites/:id</b></code> <code>Revoke a pending invite as sender or project creator</code></summary>


##### Auth

- Required 
- Accessible to the invite sender or the project creator


##### Parameters

> | name      |  type     | data type               | description                                                           |
> |-----------|-----------|-------------------------|-----------------------------------------------------------------------|
> | 'id'  |  path     | uuid   | The target invite's id  |


##### Request Body
> | name | required | data type | description |
> |------|----------|-----------|-------------|
> | `status` | required | enum | invite status: `REVOKED` |


##### Responses

> | http code     | content-type                      | response                                                            |
> |---------------|-----------------------------------|---------------------------------------------------------------------|
> | `200`         | `application/json`        | Updated invite record             |
> | `404`         | `application/json`                | `{"code":"INVITE_NOT_FOUND"}`          |
> | `400`         | `application/json`                | `{"code":"VALIDATION_ERROR"}`     |
> | `409`         | `application/json`                | `{"code":"INVITE_NOT_PENDING"}`     |

</details>

------------------------------------------------------------------------------------------