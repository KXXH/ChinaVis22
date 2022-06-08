const NODE_IMPORTANCE = {
    "Domain": 2,
    "IP": 2,
    "Cert": 2,
    "Whois_Name": 1,
    "Whois_Phone": 1,
    "Whois_Email": 1,
    "IP_C": 0,
    "ASN": 0
}

const RELATION_STRENGTH = {
    "r_cert": 3,
    "r_subdomain": 3,
    "r_request_jump": 3,
    "r_dns_a": 3,
    "r_whois_name": 2,
    "r_whois_email": 2,
    "r_whois_phone": 2,
    "r_cert_chain": 1,
    "r_cname": 1,
    "r_asn": 0,
    "r_cidr": 0
}

export {NODE_IMPORTANCE, RELATION_STRENGTH}