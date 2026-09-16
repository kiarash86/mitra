// Package testutil provides lightweight, hand-written test doubles for the
// database layer so handler-level authorization tests can run without a
// live Postgres instance.
//
// FakeQuerier implements sqlc.Querier entirely via optional function
// fields: a test only sets the fields it actually needs, and calling any
// unset method panics with a clear message identifying the gap, rather
// than silently returning a zero value that could mask a bug in the test
// itself.
package testutil

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/kiarash86/mitra/internal/db/sqlc"
)

// FakeQuerier is a test double for sqlc.Querier. Zero value is valid; every
// method panics until its corresponding field is set.
type FakeQuerier struct {
	AddProjectMemberFn      func(ctx context.Context, arg sqlc.AddProjectMemberParams) (sqlc.ProjectMember, error)
	AnyUserExistsFn         func(ctx context.Context) (bool, error)
	AssignTaskToUserFn      func(ctx context.Context, arg sqlc.AssignTaskToUserParams) (sqlc.Task, error)
	CreateCommentFn         func(ctx context.Context, arg sqlc.CreateCommentParams) (sqlc.Comment, error)
	CreateMessageFn         func(ctx context.Context, arg sqlc.CreateMessageParams) (sqlc.Message, error)
	CreateProjectFn         func(ctx context.Context, arg sqlc.CreateProjectParams) (sqlc.Project, error)
	CreateTaskFn            func(ctx context.Context, arg sqlc.CreateTaskParams) (sqlc.Task, error)
	CreateUserFn            func(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error)
	GetCommentByIDFn        func(ctx context.Context, id uuid.UUID) (sqlc.Comment, error)
	GetMessageByIDFn        func(ctx context.Context, id uuid.UUID) (sqlc.Message, error)
	GetProjectByIDFn        func(ctx context.Context, id uuid.UUID) (sqlc.Project, error)
	GetProjectMemberRoleFn  func(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error)
	GetTaskByIDFn           func(ctx context.Context, id uuid.UUID) (sqlc.Task, error)
	GetUserByEmailFn        func(ctx context.Context, email string) (sqlc.User, error)
	GetUserByIDFn           func(ctx context.Context, id uuid.UUID) (sqlc.User, error)
	ListCommentsByTaskFn    func(ctx context.Context, taskID uuid.UUID) ([]sqlc.ListCommentsByTaskRow, error)
	ListMessagesByProjectFn func(ctx context.Context, arg sqlc.ListMessagesByProjectParams) ([]sqlc.ListMessagesByProjectRow, error)
	ListProjectMembersFn    func(ctx context.Context, projectID uuid.UUID) ([]sqlc.ListProjectMembersRow, error)
	ListProjectsFn          func(ctx context.Context) ([]sqlc.Project, error)
	ListProjectsForUserFn   func(ctx context.Context, userID uuid.UUID) ([]sqlc.Project, error)
	ListTasksAssignedToUserFn func(ctx context.Context, assignedToUserID pgtype.UUID) ([]sqlc.Task, error)
	ListTasksByProjectFn    func(ctx context.Context, projectID uuid.UUID) ([]sqlc.Task, error)
	ListUsersFn             func(ctx context.Context) ([]sqlc.User, error)
	RemoveProjectMemberFn   func(ctx context.Context, arg sqlc.RemoveProjectMemberParams) error
	SoftDeleteCommentFn     func(ctx context.Context, id uuid.UUID) error
	SoftDeleteMessageFn     func(ctx context.Context, id uuid.UUID) error
	SoftDeleteProjectFn     func(ctx context.Context, id uuid.UUID) error
	SoftDeleteTaskFn        func(ctx context.Context, id uuid.UUID) error
	SoftDeleteUserFn        func(ctx context.Context, id uuid.UUID) error
	UnassignTaskFn          func(ctx context.Context, id uuid.UUID) (sqlc.Task, error)
	UpdateCommentFn         func(ctx context.Context, arg sqlc.UpdateCommentParams) (sqlc.Comment, error)
	UpdateMessageFn         func(ctx context.Context, arg sqlc.UpdateMessageParams) (sqlc.Message, error)
	UpdateProjectFn         func(ctx context.Context, arg sqlc.UpdateProjectParams) (sqlc.Project, error)
	UpdateTaskFn            func(ctx context.Context, arg sqlc.UpdateTaskParams) (sqlc.Task, error)
	UpdateTaskStatusFn      func(ctx context.Context, arg sqlc.UpdateTaskStatusParams) (sqlc.Task, error)
	UpdateUserPasswordFn    func(ctx context.Context, arg sqlc.UpdateUserPasswordParams) error
	UpdateUserProfileFn     func(ctx context.Context, arg sqlc.UpdateUserProfileParams) (sqlc.User, error)
}

func notImplemented(method string) {
	panic(fmt.Sprintf("testutil.FakeQuerier: %s was called but no %sFn was set on this test's fake", method, method))
}

func (f *FakeQuerier) AddProjectMember(ctx context.Context, arg sqlc.AddProjectMemberParams) (sqlc.ProjectMember, error) {
	if f.AddProjectMemberFn == nil {
		notImplemented("AddProjectMember")
	}
	return f.AddProjectMemberFn(ctx, arg)
}

func (f *FakeQuerier) AnyUserExists(ctx context.Context) (bool, error) {
	if f.AnyUserExistsFn == nil {
		notImplemented("AnyUserExists")
	}
	return f.AnyUserExistsFn(ctx)
}

func (f *FakeQuerier) AssignTaskToUser(ctx context.Context, arg sqlc.AssignTaskToUserParams) (sqlc.Task, error) {
	if f.AssignTaskToUserFn == nil {
		notImplemented("AssignTaskToUser")
	}
	return f.AssignTaskToUserFn(ctx, arg)
}

func (f *FakeQuerier) CreateComment(ctx context.Context, arg sqlc.CreateCommentParams) (sqlc.Comment, error) {
	if f.CreateCommentFn == nil {
		notImplemented("CreateComment")
	}
	return f.CreateCommentFn(ctx, arg)
}

func (f *FakeQuerier) CreateMessage(ctx context.Context, arg sqlc.CreateMessageParams) (sqlc.Message, error) {
	if f.CreateMessageFn == nil {
		notImplemented("CreateMessage")
	}
	return f.CreateMessageFn(ctx, arg)
}

func (f *FakeQuerier) CreateProject(ctx context.Context, arg sqlc.CreateProjectParams) (sqlc.Project, error) {
	if f.CreateProjectFn == nil {
		notImplemented("CreateProject")
	}
	return f.CreateProjectFn(ctx, arg)
}

func (f *FakeQuerier) CreateTask(ctx context.Context, arg sqlc.CreateTaskParams) (sqlc.Task, error) {
	if f.CreateTaskFn == nil {
		notImplemented("CreateTask")
	}
	return f.CreateTaskFn(ctx, arg)
}

func (f *FakeQuerier) CreateUser(ctx context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	if f.CreateUserFn == nil {
		notImplemented("CreateUser")
	}
	return f.CreateUserFn(ctx, arg)
}

func (f *FakeQuerier) GetCommentByID(ctx context.Context, id uuid.UUID) (sqlc.Comment, error) {
	if f.GetCommentByIDFn == nil {
		notImplemented("GetCommentByID")
	}
	return f.GetCommentByIDFn(ctx, id)
}

func (f *FakeQuerier) GetMessageByID(ctx context.Context, id uuid.UUID) (sqlc.Message, error) {
	if f.GetMessageByIDFn == nil {
		notImplemented("GetMessageByID")
	}
	return f.GetMessageByIDFn(ctx, id)
}

func (f *FakeQuerier) GetProjectByID(ctx context.Context, id uuid.UUID) (sqlc.Project, error) {
	if f.GetProjectByIDFn == nil {
		notImplemented("GetProjectByID")
	}
	return f.GetProjectByIDFn(ctx, id)
}

func (f *FakeQuerier) GetProjectMemberRole(ctx context.Context, arg sqlc.GetProjectMemberRoleParams) (string, error) {
	if f.GetProjectMemberRoleFn == nil {
		notImplemented("GetProjectMemberRole")
	}
	return f.GetProjectMemberRoleFn(ctx, arg)
}

func (f *FakeQuerier) GetTaskByID(ctx context.Context, id uuid.UUID) (sqlc.Task, error) {
	if f.GetTaskByIDFn == nil {
		notImplemented("GetTaskByID")
	}
	return f.GetTaskByIDFn(ctx, id)
}

func (f *FakeQuerier) GetUserByEmail(ctx context.Context, email string) (sqlc.User, error) {
	if f.GetUserByEmailFn == nil {
		notImplemented("GetUserByEmail")
	}
	return f.GetUserByEmailFn(ctx, email)
}

func (f *FakeQuerier) GetUserByID(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
	if f.GetUserByIDFn == nil {
		notImplemented("GetUserByID")
	}
	return f.GetUserByIDFn(ctx, id)
}

func (f *FakeQuerier) ListCommentsByTask(ctx context.Context, taskID uuid.UUID) ([]sqlc.ListCommentsByTaskRow, error) {
	if f.ListCommentsByTaskFn == nil {
		notImplemented("ListCommentsByTask")
	}
	return f.ListCommentsByTaskFn(ctx, taskID)
}

func (f *FakeQuerier) ListMessagesByProject(ctx context.Context, arg sqlc.ListMessagesByProjectParams) ([]sqlc.ListMessagesByProjectRow, error) {
	if f.ListMessagesByProjectFn == nil {
		notImplemented("ListMessagesByProject")
	}
	return f.ListMessagesByProjectFn(ctx, arg)
}

func (f *FakeQuerier) ListProjectMembers(ctx context.Context, projectID uuid.UUID) ([]sqlc.ListProjectMembersRow, error) {
	if f.ListProjectMembersFn == nil {
		notImplemented("ListProjectMembers")
	}
	return f.ListProjectMembersFn(ctx, projectID)
}

func (f *FakeQuerier) ListProjects(ctx context.Context) ([]sqlc.Project, error) {
	if f.ListProjectsFn == nil {
		notImplemented("ListProjects")
	}
	return f.ListProjectsFn(ctx)
}

func (f *FakeQuerier) ListProjectsForUser(ctx context.Context, userID uuid.UUID) ([]sqlc.Project, error) {
	if f.ListProjectsForUserFn == nil {
		notImplemented("ListProjectsForUser")
	}
	return f.ListProjectsForUserFn(ctx, userID)
}

func (f *FakeQuerier) ListTasksAssignedToUser(ctx context.Context, assignedToUserID pgtype.UUID) ([]sqlc.Task, error) {
	if f.ListTasksAssignedToUserFn == nil {
		notImplemented("ListTasksAssignedToUser")
	}
	return f.ListTasksAssignedToUserFn(ctx, assignedToUserID)
}

func (f *FakeQuerier) ListTasksByProject(ctx context.Context, projectID uuid.UUID) ([]sqlc.Task, error) {
	if f.ListTasksByProjectFn == nil {
		notImplemented("ListTasksByProject")
	}
	return f.ListTasksByProjectFn(ctx, projectID)
}

func (f *FakeQuerier) ListUsers(ctx context.Context) ([]sqlc.User, error) {
	if f.ListUsersFn == nil {
		notImplemented("ListUsers")
	}
	return f.ListUsersFn(ctx)
}

func (f *FakeQuerier) RemoveProjectMember(ctx context.Context, arg sqlc.RemoveProjectMemberParams) error {
	if f.RemoveProjectMemberFn == nil {
		notImplemented("RemoveProjectMember")
	}
	return f.RemoveProjectMemberFn(ctx, arg)
}

func (f *FakeQuerier) SoftDeleteComment(ctx context.Context, id uuid.UUID) error {
	if f.SoftDeleteCommentFn == nil {
		notImplemented("SoftDeleteComment")
	}
	return f.SoftDeleteCommentFn(ctx, id)
}

func (f *FakeQuerier) SoftDeleteMessage(ctx context.Context, id uuid.UUID) error {
	if f.SoftDeleteMessageFn == nil {
		notImplemented("SoftDeleteMessage")
	}
	return f.SoftDeleteMessageFn(ctx, id)
}

func (f *FakeQuerier) SoftDeleteProject(ctx context.Context, id uuid.UUID) error {
	if f.SoftDeleteProjectFn == nil {
		notImplemented("SoftDeleteProject")
	}
	return f.SoftDeleteProjectFn(ctx, id)
}

func (f *FakeQuerier) SoftDeleteTask(ctx context.Context, id uuid.UUID) error {
	if f.SoftDeleteTaskFn == nil {
		notImplemented("SoftDeleteTask")
	}
	return f.SoftDeleteTaskFn(ctx, id)
}

func (f *FakeQuerier) SoftDeleteUser(ctx context.Context, id uuid.UUID) error {
	if f.SoftDeleteUserFn == nil {
		notImplemented("SoftDeleteUser")
	}
	return f.SoftDeleteUserFn(ctx, id)
}

func (f *FakeQuerier) UnassignTask(ctx context.Context, id uuid.UUID) (sqlc.Task, error) {
	if f.UnassignTaskFn == nil {
		notImplemented("UnassignTask")
	}
	return f.UnassignTaskFn(ctx, id)
}

func (f *FakeQuerier) UpdateComment(ctx context.Context, arg sqlc.UpdateCommentParams) (sqlc.Comment, error) {
	if f.UpdateCommentFn == nil {
		notImplemented("UpdateComment")
	}
	return f.UpdateCommentFn(ctx, arg)
}

func (f *FakeQuerier) UpdateMessage(ctx context.Context, arg sqlc.UpdateMessageParams) (sqlc.Message, error) {
	if f.UpdateMessageFn == nil {
		notImplemented("UpdateMessage")
	}
	return f.UpdateMessageFn(ctx, arg)
}

func (f *FakeQuerier) UpdateProject(ctx context.Context, arg sqlc.UpdateProjectParams) (sqlc.Project, error) {
	if f.UpdateProjectFn == nil {
		notImplemented("UpdateProject")
	}
	return f.UpdateProjectFn(ctx, arg)
}

func (f *FakeQuerier) UpdateTask(ctx context.Context, arg sqlc.UpdateTaskParams) (sqlc.Task, error) {
	if f.UpdateTaskFn == nil {
		notImplemented("UpdateTask")
	}
	return f.UpdateTaskFn(ctx, arg)
}

func (f *FakeQuerier) UpdateTaskStatus(ctx context.Context, arg sqlc.UpdateTaskStatusParams) (sqlc.Task, error) {
	if f.UpdateTaskStatusFn == nil {
		notImplemented("UpdateTaskStatus")
	}
	return f.UpdateTaskStatusFn(ctx, arg)
}

func (f *FakeQuerier) UpdateUserPassword(ctx context.Context, arg sqlc.UpdateUserPasswordParams) error {
	if f.UpdateUserPasswordFn == nil {
		notImplemented("UpdateUserPassword")
	}
	return f.UpdateUserPasswordFn(ctx, arg)
}

func (f *FakeQuerier) UpdateUserProfile(ctx context.Context, arg sqlc.UpdateUserProfileParams) (sqlc.User, error) {
	if f.UpdateUserProfileFn == nil {
		notImplemented("UpdateUserProfile")
	}
	return f.UpdateUserProfileFn(ctx, arg)
}

var _ sqlc.Querier = (*FakeQuerier)(nil)
