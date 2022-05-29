export default function colorMap(node){
    const { type } = node;
    switch(type){
        case "Domain": return 0x7fc97f;
        case "IP": return 0xbeaed4;
        case "Cert": return 0xfdc086;
        case "Whois_Name": return 0xffff99;
        case "Whois_Phone": return 0x386cb0;
        case "Whois_Email": return 0xf0027f;
    }
}