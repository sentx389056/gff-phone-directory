<?php
	define('DB_HOST', '10.1.10.17');
	define('DB_USER', 'pb');
	define('DB_PASSWD', 'Pas355287!');
	define('DB_NAME', 'pb');
	define('DB_CPAGE', 'utf8');
	define('DB_PREFIX', 'pb_');

	define('APP_LANGUAGE', 'ru');

	define('PB_USE_LDAP_AUTH', 0);

	define('LDAP_HOST', '192.168.0.10');
	define('LDAP_PORT', 389);
	define('LDAP_URI', 'ldap://dc0.gff-rf.ru');
	define('LDAP_USER', 'GFF-RF\contact');
	define('LDAP_PASSWD', 'Rfrpljhjdj23!!');
	define('LDAP_BASE_DN', 'DC=GFF-RF,DC=RU');
	define('LDAP_BASE_FILTER', '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))');
	//  define('LDAP_FILTER', '(&(objectCategory=person)(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2))(|(telephoneNumber=*)(mobile=*)(ipPhone=*)))');
	define('LDAP_ATTRS', 'samAccountName,ou,sn,givenName,displayName,mail,department,company,title,telephoneNumber,mobile,ipPhone,thumbnailPhoto,userAccountControl');
	define('LDAP_ADMIN_GROUP_DN', 'CN=Phonebook admin,OU=Admin Roles,OU=Groups,OU=Company,DC=domain,DC=local');

	define('MAIL_HOST', 'smtp.yandex.ru');
	define('MAIL_FROM', 'm.mizanov@yandex.ru');
	define('MAIL_FROM_NAME', 'Robot');
	define('MAIL_ADMIN', 'm.mizanov@yandex.ru');
	define('MAIL_ADMIN_NAME', 'Admin');
	define('MAIL_AUTH', true);
	define('MAIL_LOGIN', 'm.mizanov@yandex.ru');
	define('MAIL_PASSWD', '');
	define('MAIL_SECURE', 'ssl');
	define('MAIL_PORT', 465);

	define('ALLOW_MAILS', '^.+@.+$');
	define('PB_MAPS_COUNT', 5);

	$map_names = array('1-й этаж ЦО', 'Floor 3', 'Floor 6', 'Floor 14', 'Floor 25');
	$g_icons = array('Human', 'Printer', 'Fax');
