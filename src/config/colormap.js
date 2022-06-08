export default function colorMap(node){
    const { type } = node;
    switch(type){
        case "Domain": return 0x7fc97f; //#7fc97f, 绿色
        case "IP": return 0xbeaed4; //#beaed4, 紫色
        case "Cert": return 0xfdc086;   // #fdc086, 橙色
        case "Whois_Name": return 0xffff99; // #ffff99, 黄色
        case "Whois_Phone": return 0x386cb0;    // #386cb0, 蓝色
        case "Whois_Email": return 0xf0027f;    // #f0027f, 红色
    }
}