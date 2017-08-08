var checkInput = function () {
    var name = $("#user_name").val();
    if (name === "") {
        alert("用户名不能为空!")
        return false;
    }
    var password = $("#password").val();
    if (password === "") {
        alert("密码不能为空!");
        return false;
    }
}


$(document).ready(function () {
    $("#submit").on("click", checkInput);
})

