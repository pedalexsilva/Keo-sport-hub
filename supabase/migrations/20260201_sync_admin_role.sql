-- Sync is_admin flag with existing role column
update profiles 
set is_admin = true 
where role = 'admin';

-- Verify the update
select id, full_name, role, is_admin from profiles where role = 'admin';
