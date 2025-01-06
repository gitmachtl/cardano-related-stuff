# Determine OS platform
OS_ID=$( (grep -i ^ID_LIKE= /etc/os-release || grep -i ^ID= /etc/os-release) | cut -d= -f 2)
DISTRO=$(grep -i ^NAME= /etc/os-release | cut -d= -f 2)

if [ -z "${OS_ID##*debian*}" ]; then
  #Debian/Ubuntu
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
  RELEASE=$(lsb_release -cs)
  echo "deb [arch=amd64] http://apt.postgresql.org/pub/repos/apt/ ${RELEASE}"-pgdg main | sudo tee  /etc/apt/sources.list.d/pgdg.list
  sudo apt-get update
  sudo apt-get -y install postgresql-17 postgresql-server-dev-17 postgresql-contrib libghc-hdbc-postgresql-dev
  sudo systemctl enable postgresql
else
  echo "We have no automated procedures for this ${DISTRO} system"
fi

