// StaffRolesPage.tsx - UPDATED with required permission description
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Card,
  Tag,
  Popconfirm,
  Tabs,
  Checkbox,
  Typography,
  Row,
  Col,
  Badge,
  Tooltip,
  Breadcrumb,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  MailOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  HomeOutlined,
  UserSwitchOutlined,
  KeyOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Column } = Table;
const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;
const { Search } = Input;

interface StaffMember {
  id: number;
  username: string;
  email: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  userRoles: {
    role: {
      id: number;
      name: string;
      description?: string;
    };
  }[];
  advisorDetails?: any;
  hodDetails?: any;
  principalDetails?: any;
}

interface Role {
  id: number;
  name: string;
  description?: string;
  _count?: {
    userRoles: number;
    permissions: number;
  };
  permissions?: {
    permission: Permission;
  }[];
}

interface Permission {
  id: number;
  name: string;
  description?: string;
  moduleName: string;
  action: string;
  _count?: {
    roles: number;
  };
}

const StaffRolesPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");
  const [roleForm] = Form.useForm();
  const [staffForm] = Form.useForm();
  const [permissionForm] = Form.useForm();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("staff");

  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);
  const [isStaffModalVisible, setIsStaffModalVisible] = useState(false);
  const [isPermissionModalVisible, setIsPermissionModalVisible] =
    useState(false);
  const [isRolePermissionsModalVisible, setIsRolePermissionsModalVisible] =
    useState(false);

  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] =
    useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const [searchText, setSearchText] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // API Configuration - DIRECT URL like your fee management
  const API_BASE_URL = "http://localhost:3000";

  const getHeaders = () => {
    const authToken = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`; // Add Bearer prefix
    }

    return headers;
  };

  // Check authentication
  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  // Fetch staff with pagination
  const fetchStaff = async (page = 1, search = "") => {
    setStaffLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/users?page=${page}&limit=10&search=${search}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setStaff(data.data);
        setPagination((prev) => ({
          ...prev,
          current: data.pagination.page,
          total: data.pagination.total,
        }));
      } else {
        message.error(data.message || "Failed to fetch staff");
      }
    } catch (error) {
      console.error("Fetch staff error:", error);
      message.error("Failed to fetch staff");
    } finally {
      setStaffLoading(false);
    }
  };

  // Fetch roles with pagination
  const fetchRoles = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/roles?page=${page}&limit=10&search=${search}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setRoles(data.data);
        setPagination((prev) => ({
          ...prev,
          current: data.pagination.page,
          total: data.pagination.total,
        }));
      } else {
        message.error(data.message || "Failed to fetch roles");
      }
    } catch (error) {
      console.error("Fetch roles error:", error);
      message.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions with pagination
  const fetchPermissions = async (page = 1, search = "") => {
    setPermissionsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/permissions?page=${page}&limit=12&search=${search}`,
        { headers: getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setPermissions(data.data);
        setPagination((prev) => ({
          ...prev,
          current: data.pagination.page,
          total: data.pagination.total,
        }));
      } else {
        message.error(data.message || "Failed to fetch permissions");
      }
    } catch (error) {
      console.error("Fetch permissions error:", error);
      message.error("Failed to fetch permissions");
    } finally {
      setPermissionsLoading(false);
    }
  };

  // Load data based on active tab
  const loadData = () => {
    switch (activeTab) {
      case "staff":
        fetchStaff(1, searchText);
        break;
      case "roles":
        fetchRoles(1, searchText);
        break;
      case "permissions":
        fetchPermissions(1, searchText);
        break;
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [activeTab, token]);

  // Handle Role Operations
  const handleRoleSubmit = async (values: any) => {
    try {
      const url = editingRole
        ? `${API_BASE_URL}/api/roles/${editingRole.id}`
        : `${API_BASE_URL}/api/roles`;
      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        setIsRoleModalVisible(false);
        roleForm.resetFields();
        setEditingRole(null);
        fetchRoles();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error saving role:", error);
      message.error("Error saving role");
    }
  };

  const handleDeleteRole = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/roles/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        message.success("Role deleted successfully");
        fetchRoles();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      message.error("Error deleting role");
    }
  };

  // Handle Staff Operations
  const handleStaffSubmit = async (values: any) => {
    try {
      const url = editingStaff
        ? `${API_BASE_URL}/api/users/${editingStaff.id}`
        : `${API_BASE_URL}/api/users`;
      const method = editingStaff ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        setIsStaffModalVisible(false);
        staffForm.resetFields();
        setEditingStaff(null);
        fetchStaff();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error saving staff:", error);
      message.error("Error saving staff");
    }
  };

  const handleDeleteStaff = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        message.success("Staff deactivated successfully");
        fetchStaff();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error deactivating staff:", error);
      message.error("Error deactivating staff");
    }
  };

  // Handle Permission Operations
  const handlePermissionSubmit = async (values: any) => {
    try {
      const url = editingPermission
        ? `${API_BASE_URL}/api/permissions/${editingPermission.id}`
        : `${API_BASE_URL}/api/permissions`;
      const method = editingPermission ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(data.message);
        setIsPermissionModalVisible(false);
        permissionForm.resetFields();
        setEditingPermission(null);
        fetchPermissions();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error saving permission:", error);
      message.error("Error saving permission");
    }
  };

  const handleDeletePermission = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/permissions/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });

      const data = await response.json();
      if (data.success) {
        message.success("Permission deleted successfully");
        fetchPermissions();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting permission:", error);
      message.error("Error deleting permission");
    }
  };

  // Handle Role Permissions
  const handleRolePermissionsSave = async () => {
    if (!selectedRoleForPermissions) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/roles/${selectedRoleForPermissions.id}/permissions`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ permissionIds: selectedPermissions }),
        }
      );

      const data = await response.json();
      if (data.success) {
        message.success("Role permissions updated successfully");
        setIsRolePermissionsModalVisible(false);
        setSelectedRoleForPermissions(null);
        setSelectedPermissions([]);
        fetchRoles();
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Error updating role permissions:", error);
      message.error("Error updating role permissions");
    }
  };

  const showRoleModal = (role: Role | null = null) => {
    setEditingRole(role);
    if (role) {
      roleForm.setFieldsValue({
        name: role.name,
        description: role.description,
      });
    } else {
      roleForm.resetFields();
    }
    setIsRoleModalVisible(true);
  };

  const showStaffModal = (staffMember: StaffMember | null = null) => {
    setEditingStaff(staffMember);
    if (staffMember) {
      staffForm.setFieldsValue({
        username: staffMember.username,
        email: staffMember.email,
        status: staffMember.status,
        roleIds: staffMember.userRoles.map((ur) => ur.role.id),
      });
    } else {
      staffForm.setFieldsValue({
        status: "active",
      });
    }
    setIsStaffModalVisible(true);
  };

  const showPermissionModal = (permission: Permission | null = null) => {
    setEditingPermission(permission);
    if (permission) {
      permissionForm.setFieldsValue({
        name: permission.name,
        description: permission.description,
        moduleName: permission.moduleName,
        action: permission.action,
      });
    } else {
      permissionForm.resetFields();
    }
    setIsPermissionModalVisible(true);
  };

  const showRolePermissionsModal = async (role: Role) => {
    setSelectedRoleForPermissions(role);

    // Fetch role permissions
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/roles/${role.id}/permissions`,
        { headers: getHeaders() }
      );

      const data = await response.json();
      if (data.success) {
        setSelectedPermissions(data.data.map((p: Permission) => p.id));
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error("Failed to fetch role permissions:", error);
      message.error("Failed to fetch role permissions");
    }

    setIsRolePermissionsModalVisible(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      case "suspended":
        return "orange";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleTableChange = (pagination: any) => {
    switch (activeTab) {
      case "staff":
        fetchStaff(pagination.current, searchText);
        break;
      case "roles":
        fetchRoles(pagination.current, searchText);
        break;
      case "permissions":
        fetchPermissions(pagination.current, searchText);
        break;
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    switch (activeTab) {
      case "staff":
        fetchStaff(1, value);
        break;
      case "roles":
        fetchRoles(1, value);
        break;
      case "permissions":
        fetchPermissions(1, value);
        break;
    }
  };

  const getRoleBadges = (staffMember: StaffMember) => {
    const badges = [];
    if (staffMember.advisorDetails)
      badges.push({ text: "Advisor", color: "blue" });
    if (staffMember.hodDetails) badges.push({ text: "HOD", color: "purple" });
    if (staffMember.principalDetails)
      badges.push({ text: "Principal", color: "gold" });
    return badges;
  };

  const permissionmoduleNames = [
    "students",
    "fees",
    "certificates",
    "no-due",
    "users",
    "roles",
    "settings",
    "dashboard",
    "reports",
  ];

  if (!token) {
    return null;
  }

  return (
    <div className="p-6">
      <Breadcrumb
        items={[
          { title: <HomeOutlined />, href: "/admin" },
          { title: "Administration" },
          { title: "Staff & Roles" },
        ]}
        className="mb-4"
      />

      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="mb-2">
            <TeamOutlined className="mr-2" />
            Staff & Roles Management
          </Title>
          <Text type="secondary">
            Manage staff members, roles, and permissions for the system
          </Text>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Search
            placeholder={`Search ${activeTab}...`}
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <div className="flex gap-2">
            {activeTab === "staff" && (
              <Button
                type="primary"
                icon={<UserSwitchOutlined />}
                onClick={() => showStaffModal()}
              >
                Add Staff
              </Button>
            )}
            {activeTab === "roles" && (
              <Button
                type="primary"
                icon={<TeamOutlined />}
                onClick={() => showRoleModal()}
              >
                Add Role
              </Button>
            )}
            {activeTab === "permissions" && (
              <Button
                type="primary"
                icon={<KeyOutlined />}
                onClick={() => showPermissionModal()}
              >
                Add Permission
              </Button>
            )}
          </div>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* Staff Tab */}
          <TabPane
            tab={
              <span>
                <UserOutlined />
                Staff Members
                <Badge count={staff.length} offset={[10, -5]} />
              </span>
            }
            key="staff"
          >
            <Table
              dataSource={staff}
              loading={staffLoading}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} staff members`,
              }}
              onChange={handleTableChange}
            >
              <Column
                title="Username"
                dataIndex="username"
                key="username"
                sorter={(a, b) => a.username.localeCompare(b.username)}
              />
              <Column
                title="Email"
                dataIndex="email"
                key="email"
                sorter={(a, b) => a.email.localeCompare(b.email)}
              />
              <Column
                title="Roles & Positions"
                key="roles"
                render={(_, record: StaffMember) => (
                  <Space direction="vertical" size="small">
                    <Space wrap>
                      {record.userRoles.map((ur, index) => (
                        <Tag key={index} color="blue">
                          {ur.role.name}
                        </Tag>
                      ))}
                    </Space>
                    <Space wrap>
                      {getRoleBadges(record).map((badge, index) => (
                        <Tag key={index} color={badge.color}>
                          {badge.text}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                )}
              />
              <Column
                title="Status"
                dataIndex="status"
                key="status"
                filters={[
                  { text: "Active", value: "active" },
                  { text: "Inactive", value: "inactive" },
                  { text: "Suspended", value: "suspended" },
                ]}
                onFilter={(value, record) => record.status === value}
                render={(status) => (
                  <Tag color={getStatusColor(status)}>
                    {status.toUpperCase()}
                  </Tag>
                )}
              />
              <Column
                title="Last Login"
                dataIndex="lastLogin"
                key="lastLogin"
                render={(lastLogin) =>
                  lastLogin ? formatDate(lastLogin) : "Never"
                }
              />
              <Column
                title="Created"
                dataIndex="createdAt"
                key="createdAt"
                render={(createdAt) => formatDate(createdAt)}
                sorter={(a, b) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
                }
              />
              <Column
                title="Actions"
                key="actions"
                width={150}
                fixed="right"
                render={(_, record: StaffMember) => (
                  <Space>
                    <Tooltip title="Edit">
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => showStaffModal(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Deactivate">
                      <Popconfirm
                        title="Deactivate this staff member?"
                        description="This will prevent them from logging in."
                        onConfirm={() => handleDeleteStaff(record.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          disabled={record.status === "inactive"}
                        />
                      </Popconfirm>
                    </Tooltip>
                  </Space>
                )}
              />
            </Table>
          </TabPane>

          {/* Roles Tab */}
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Roles
                <Badge count={roles.length} offset={[10, -5]} />
              </span>
            }
            key="roles"
          >
            <Table
              dataSource={roles}
              loading={loading}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} roles`,
              }}
              onChange={handleTableChange}
            >
              <Column
                title="Role Name"
                dataIndex="name"
                key="name"
                sorter={(a, b) => a.name.localeCompare(b.name)}
              />
              <Column
                title="Description"
                dataIndex="description"
                key="description"
                ellipsis
              />
              <Column
                title="Users"
                key="users"
                render={(_, record: Role) => (
                  <Tooltip
                    title={`${record._count?.userRoles || 0} users assigned`}
                  >
                    <Badge count={record._count?.userRoles || 0} showZero />
                  </Tooltip>
                )}
              />
              <Column
                title="Permissions"
                key="permissions"
                render={(_, record: Role) => (
                  <Tooltip
                    title={`${record._count?.permissions || 0} permissions`}
                  >
                    <Badge
                      count={record._count?.permissions || 0}
                      showZero
                      style={{ backgroundColor: "#52c41a" }}
                    />
                  </Tooltip>
                )}
              />
              <Column
                title="Actions"
                key="actions"
                width={200}
                fixed="right"
                render={(_, record: Role) => (
                  <Space>
                    <Tooltip title="Edit">
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => showRoleModal(record)}
                      />
                    </Tooltip>
                    <Tooltip title="Manage Permissions">
                      <Button
                        type="link"
                        size="small"
                        icon={<SafetyCertificateOutlined />}
                        onClick={() => showRolePermissionsModal(record)}
                      >
                        Permissions
                      </Button>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Popconfirm
                        title="Delete this role?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDeleteRole(record.id)}
                        okText="Yes"
                        cancelText="No"
                        disabled={
                          record._count?.userRoles
                            ? record._count.userRoles > 0
                            : false
                        }
                      >
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          disabled={
                            record._count?.userRoles
                              ? record._count.userRoles > 0
                              : false
                          }
                        />
                      </Popconfirm>
                    </Tooltip>
                  </Space>
                )}
              />
            </Table>
          </TabPane>

          {/* Permissions Tab */}
          <TabPane
            tab={
              <span>
                <KeyOutlined />
                Permissions
                <Badge count={permissions.length} offset={[10, -5]} />
              </span>
            }
            key="permissions"
          >
            <Row gutter={[16, 16]}>
              {permissions.map((permission) => (
                <Col xs={24} sm={12} md={8} lg={6} key={permission.id}>
                  <Card
                    size="small"
                    title={
                      <div className="flex justify-between items-center">
                        <span className="truncate">{permission.name}</span>
                        <Badge
                          count={permission._count?.roles || 0}
                          size="small"
                          style={{ backgroundColor: "#1890ff" }}
                        />
                      </div>
                    }
                    extra={
                      <Space>
                        <Button
                          type="link"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => showPermissionModal(permission)}
                        />
                        <Popconfirm
                          title="Delete this permission?"
                          description="This will remove it from all roles."
                          onConfirm={() =>
                            handleDeletePermission(permission.id)
                          }
                          okText="Yes"
                          cancelText="No"
                          disabled={
                            permission._count?.roles
                              ? permission._count.roles > 0
                              : false
                          }
                        >
                          <Button
                            type="link"
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            disabled={
                              permission._count?.roles
                                ? permission._count.roles > 0
                                : false
                            }
                          />
                        </Popconfirm>
                      </Space>
                    }
                    hoverable
                  >
                    <div className="space-y-2">
                      <div>
                        <Text strong>Module: </Text>
                        <Tag color="blue">{permission.moduleName}</Tag>
                      </div>
                      <div>
                        <Text strong>Action: </Text>
                        <Tag color="green">{permission.action}</Tag>
                      </div>
                      {permission.description && (
                        <div>
                          <Text strong>Description: </Text>
                          <Text type="secondary" className="block truncate">
                            {permission.description}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            {permissions.length === 0 && !permissionsLoading && (
              <div className="text-center py-8">
                <SafetyCertificateOutlined className="text-4xl text-gray-300 mb-4" />
                <Title level={4}>No permissions found</Title>
                <Text type="secondary">
                  Create your first permission to get started
                </Text>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Role Modal */}
      <Modal
        title={editingRole ? "Edit Role" : "Add New Role"}
        open={isRoleModalVisible}
        onCancel={() => {
          setIsRoleModalVisible(false);
          roleForm.resetFields();
          setEditingRole(null);
        }}
        onOk={() => roleForm.submit()}
        okText={editingRole ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <Form form={roleForm} layout="vertical" onFinish={handleRoleSubmit}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: "Please enter role name" },
              {
                pattern: /^[a-z_]+$/,
                message: "Use lowercase letters and underscores only",
              },
            ]}
          >
            <Input
              placeholder="Enter role name (e.g., admin, advisor, hod)"
              disabled={!!editingRole}
            />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Enter role description"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Staff Modal */}
      <Modal
        title={editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
        open={isStaffModalVisible}
        width={600}
        onCancel={() => {
          setIsStaffModalVisible(false);
          staffForm.resetFields();
          setEditingStaff(null);
        }}
        onOk={() => staffForm.submit()}
        okText={editingStaff ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <Form form={staffForm} layout="vertical" onFinish={handleStaffSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: "Please enter username" },
                  { min: 3, message: "Username must be at least 3 characters" },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter username"
                  disabled={!!editingStaff}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter valid email" },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Enter email"
                  type="email"
                />
              </Form.Item>
            </Col>
          </Row>

          {!editingStaff && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter password" },
                { min: 6, message: "Password must be at least 6 characters" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter password"
              />
            </Form.Item>
          )}

          <Form.Item
            name="roleIds"
            label="Roles"
            rules={[
              { required: true, message: "Please select at least one role" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roles.map((role) => ({
                label: role.name,
                value: role.id,
                description: role.description,
              }))}
              optionRender={(option) => (
                <div>
                  <div>{option.label}</div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    {option.data.description || "No description"}
                  </div>
                </div>
              )}
            />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="active">
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="suspended">Suspended</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Modal */}
      <Modal
        title={editingPermission ? "Edit Permission" : "Add New Permission"}
        open={isPermissionModalVisible}
        onCancel={() => {
          setIsPermissionModalVisible(false);
          permissionForm.resetFields();
          setEditingPermission(null);
        }}
        onOk={() => permissionForm.submit()}
        okText={editingPermission ? "Update" : "Create"}
        cancelText="Cancel"
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handlePermissionSubmit}
        >
          <Form.Item
            name="name"
            label="Permission Name"
            rules={[
              { required: true, message: "Please enter permission name" },
              {
                pattern: /^[a-z:]+$/,
                message: "Use lowercase letters and colon only",
              },
            ]}
          >
            <Input placeholder="Enter permission name (e.g., view:students, create:fees)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="moduleName"
                label="Module"
                rules={[{ required: true, message: "Please select module" }]}
              >
                <Select
                  placeholder="Select module"
                  options={permissionmoduleNames.map((moduleName) => ({
                    label: moduleName,
                    value: moduleName,
                  }))}
                  showSearch
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="action"
                label="Action"
                rules={[{ required: true, message: "Please select action" }]}
              >
                <Select placeholder="Select action">
                  <Option value="create">Create</Option>
                  <Option value="read">Read/View</Option>
                  <Option value="update">Update/Edit</Option>
                  <Option value="delete">Delete</Option>
                  <Option value="approve">Approve</Option>
                  <Option value="reject">Reject</Option>
                  <Option value="manage">Manage</Option>
                  <Option value="export">Export</Option>
                  <Option value="import">Import</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              {
                required: true,
                message: "Please enter permission description",
              },
              { min: 5, message: "Description must be at least 5 characters" },
              { max: 200, message: "Description cannot exceed 200 characters" },
            ]}
          >
            <Input.TextArea
              placeholder="Enter permission description (what this permission allows)"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Role Permissions Modal */}
      <Modal
        title={`Manage Permissions for ${selectedRoleForPermissions?.name}`}
        open={isRolePermissionsModalVisible}
        width={700}
        onCancel={() => {
          setIsRolePermissionsModalVisible(false);
          setSelectedRoleForPermissions(null);
          setSelectedPermissions([]);
        }}
        onOk={handleRolePermissionsSave}
        okText="Save Permissions"
        cancelText="Cancel"
      >
        {selectedRoleForPermissions && (
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded">
              <Text strong>Role: </Text>
              <Tag color="blue">{selectedRoleForPermissions.name}</Tag>
              {selectedRoleForPermissions.description && (
                <>
                  <Text strong className="ml-4">
                    Description:{" "}
                  </Text>
                  <Text>{selectedRoleForPermissions.description}</Text>
                </>
              )}
            </div>

            <Text className="block mb-3">
              Select permissions for this role:
            </Text>

            <div className="max-h-96 overflow-y-auto border rounded p-4">
              {/* Group permissions by moduleName */}
              {Array.from(new Set(permissions.map((p) => p.moduleName))).map(
                (moduleName) => {
                  const modulePermissions = permissions.filter(
                    (p) => p.moduleName === moduleName
                  );
                  const allModuleSelected = modulePermissions.every((p) =>
                    selectedPermissions.includes(p.id)
                  );
                  const someModuleSelected = modulePermissions.some((p) =>
                    selectedPermissions.includes(p.id)
                  );

                  return (
                    <div key={moduleName} className="mb-6">
                      <div className="flex items-center mb-2 pb-2 border-b">
                        <Checkbox
                          indeterminate={
                            someModuleSelected && !allModuleSelected
                          }
                          checked={allModuleSelected}
                          onChange={(e) => {
                            const modulePermissionIds = modulePermissions.map(
                              (p) => p.id
                            );
                            if (e.target.checked) {
                              // Add all module permissions
                              setSelectedPermissions((prev) =>
                                Array.from(
                                  new Set([...prev, ...modulePermissionIds])
                                )
                              );
                            } else {
                              // Remove all module permissions
                              setSelectedPermissions((prev) =>
                                prev.filter(
                                  (id) => !modulePermissionIds.includes(id)
                                )
                              );
                            }
                          }}
                        >
                          <Text strong className="ml-2 text-lg">
                            {moduleName.charAt(0).toUpperCase() +
                              moduleName.slice(1)}{" "}
                            Module
                          </Text>
                        </Checkbox>
                      </div>

                      <Row gutter={[16, 8]}>
                        {modulePermissions.map((permission) => (
                          <Col span={12} key={permission.id}>
                            <Checkbox
                              checked={selectedPermissions.includes(
                                permission.id
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPermissions([
                                    ...selectedPermissions,
                                    permission.id,
                                  ]);
                                } else {
                                  setSelectedPermissions(
                                    selectedPermissions.filter(
                                      (id) => id !== permission.id
                                    )
                                  );
                                }
                              }}
                            >
                              <div className="ml-2">
                                <div className="font-medium">
                                  {permission.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  <Tag color="green" className="text-xs">
                                    {permission.action}
                                  </Tag>
                                  {permission.description}
                                </div>
                              </div>
                            </Checkbox>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <Text strong>Selected: </Text>
              <Tag color="blue">{selectedPermissions.length} permissions</Tag>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffRolesPage;
