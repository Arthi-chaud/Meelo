import Roles from './roles.decorator';
import Role from './roles.enum';
/**
 * Controller / Route decorator to allow only admin users to use it
 */
const Admin = () => Roles(Role.Admin);

export default Admin;
