var test_string = "中文，:abc";
test_string.replace(/([\u4E00-\u9FA5])([a-z])/, "$1 $2");