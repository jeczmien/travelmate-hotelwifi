# SPDX-License-Identifier: Apache-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=travelmate-hotelwifi
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

PKGARCH:=all

include $(INCLUDE_DIR)/package.mk

define Package/travelmate-hotelwifi
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Hotel Wi-Fi Travelmate panel
  URL:=https://github.com/jeczmien/travelmate-hotelwifi
  DEPENDS:=+travelmate +rpcd +rpcd-mod-ucode +ucode +ucode-mod-fs +ucode-mod-ubus +ucode-mod-uci +uhttpd +uhttpd-mod-ubus
endef

define Package/travelmate-hotelwifi/description
 A small mobile-friendly web interface for managing Travelmate Wi-Fi
 uplinks on OpenWrt. It supports scanning, adding, enabling, disabling,
 prioritizing and removing remembered wireless networks.
endef

Build/Configure:=
Build/Compile:=

define Package/travelmate-hotelwifi/install
	$(INSTALL_DIR) $(1)/www/hotelwifi
	$(CP) ./htdocs/hotelwifi/. $(1)/www/hotelwifi/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/ucode
	$(INSTALL_DATA) ./root/usr/share/rpcd/ucode/hotelwifi \
	$(1)/usr/share/rpcd/ucode/hotelwifi

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/hotelwifi.json \
	$(1)/usr/share/rpcd/acl.d/hotelwifi.json

	$(INSTALL_DIR) $(1)/usr/libexec
	$(INSTALL_BIN) ./root/usr/libexec/hotelwifi-scan \
	$(1)/usr/libexec/hotelwifi-scan

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./root/etc/uci-defaults/90-hotelwifi \
	$(1)/etc/uci-defaults/90-hotelwifi
endef

define Package/travelmate-hotelwifi/prerm
#!/bin/sh

if [ -z "$${IPKG_INSTROOT}" ]; then
	uci -q delete rpcd.hotelwifi || true
	uci commit rpcd
	/etc/init.d/rpcd reload 2>/dev/null || true
fi

exit 0
endef

$(eval $(call BuildPackage,travelmate-hotelwifi))
