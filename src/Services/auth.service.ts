import { Injectable } from '@nestjs/common';
import { response } from '../utils/response';
import { user_reg, user_login } from '../utils/validator';
import {
  cognitoUserSignUp,
  confirmSignUp,
  cognitoSignIn,
  getUserFromCognito,
  cognitoForgotPassword,
  forgotPasswordVerification,
} from '../lib/cognito';
import { queries } from '../Queries/index.query';
import { ACTIONS } from '../lib/mongoose';
import { StatusCodes } from 'http-status-codes';
import { getValueFromAttributes, fetch_single_user } from '../utils/user';

@Injectable()
export class AuthService {
  async register(req, res): Promise<any> {
    if (!!user_reg.validate(req.body)) {
      response({
        message: user_reg.validate(req.body),
        res,
        success: false,
        code: StatusCodes.UNPROCESSABLE_ENTITY,
      });

      return;
    }

    try {
      await cognitoUserSignUp({
        ...req.body,
      });

      const newUser = await queries.updateToDb(
        [{ email: req.body.email }],
        ACTIONS.CREATE,
      );
      newUser.save();
      response({
        message: user_reg.resp_msg_registration,
        success: true,
        code: StatusCodes.OK,
        res,
      });
    } catch (err) {
      response({
        message: err.message,
        res,
        success: false,
        code: err?.statusCode ?? StatusCodes.UNPROCESSABLE_ENTITY,
      });
    }
  }

  async login(req, res): Promise<any> {
    const { email, password } = req.body;
    try {
      if (!email || !password) {
        response({
          message: user_reg.validate(req.body),
          res,
          success: false,
          code: StatusCodes.UNPROCESSABLE_ENTITY,
        });
        return;
      }

      // Call cognito endpoint to login
      const data: any = await cognitoSignIn({
        email,
        password,
      });

      // Fetch user from token returned by cognito
      const user: any = await getUserFromCognito(
        data.AuthenticationResult.AccessToken,
      );

      const userDetails = {
        accessToken: data?.AuthenticationResult?.AccessToken,
        refreshToken: data?.AuthenticationResult?.RefreshToken,
        idToken: data?.AuthenticationResult?.IdToken,
        email: getValueFromAttributes(user.UserAttributes, 'email'),
        user_id: getValueFromAttributes(user.UserAttributes, 'custom:user_id'),
        verified: getValueFromAttributes(user.UserAttributes, 'email_verified'),
        phone_number: getValueFromAttributes(
          user.UserAttributes,
          'custom:phoneNumber',
        ),
        createdAt: getValueFromAttributes(
          user.UserAttributes,
          'custom:createdAt',
        ),
        first_Name: getValueFromAttributes(
          user.UserAttributes,
          'custom:firstName',
        ),
        last_Name: getValueFromAttributes(
          user.UserAttributes,
          'custom:lastName',
        ),
      };

      const userExits = await fetch_single_user(userDetails.email);

      if (!userExits.message.hasOwnProperty('user_id')) {
        await queries.updateToDb(
          [
            { email: userDetails.email },
            {
              user_id: userDetails.user_id,
            },
          ],
          ACTIONS.FINDONEANDUPDATE,
        );
      }

      response({
        message: {
          ...userDetails,
          login: user_login.login_success,
        },
        success: true,
        code: StatusCodes.OK,
        res,
      });
    } catch (err) {
      response({
        message: err.message,
        res,
        success: false,
        code: err?.statusCode ?? StatusCodes.UNPROCESSABLE_ENTITY,
      });
    }
  }
}
